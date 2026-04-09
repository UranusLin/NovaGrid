/**
 * Aleo Compliance Prover
 *
 * Runs the three compliance.aleo transitions server-side using the Aleo CLI:
 *   1. verify_compliance      — location check
 *   2. verify_device_credentials — uptime/hashrate check
 *   3. compute_node_score     — trust score calculation
 *
 * Each step calls `leo execute` (or `snarkos developer execute` for testnet broadcast).
 * For the relayer, we only need the plaintext output values (no on-chain proof needed
 * for score computation — the score is a public value that anyone can verify).
 *
 * Prerequisites:
 *   - Leo CLI v4.0.0+ installed and on PATH
 *   - ALEO_PRIVATE_KEY set in environment
 */

import { execSync } from 'child_process';
import type { DeviceMetrics, ProofResult, RegionBounds } from './types.js';

// Approved region for DePIN nodes (Taiwan region, scaled by 1e6)
const APPROVED_REGION: RegionBounds = {
  min_lat: 21_890_000,
  max_lat: 25_300_000,
  min_lng: 119_980_000,
  max_lng: 122_010_000,
};

// Minimum operational thresholds
const MIN_UPTIME = 80;    // 80% uptime required
const MIN_HASHRATE = 100; // 100 TH/s required

// Normalize hashrate to 0–100 score (caps at 1000 TH/s for full score)
function normalizeHashrate(hashrateThs: number): number {
  return Math.min(100, Math.floor((hashrateThs / 1000) * 100));
}

/**
 * Run a Leo program offline (no broadcast) and parse the boolean/u64 output.
 * Uses `leo run` which executes locally without submitting to the network.
 */
function leoRun(
  programPath: string,
  transitionName: string,
  inputs: string[]
): string {
  const inputStr = inputs.join(' ');
  const cmd = `cd "${programPath}" && leo run ${transitionName} ${inputStr}`;
  const output = execSync(cmd, { encoding: 'utf8', timeout: 60_000 });
  return output;
}

/**
 * Parse the first output value from `leo run` stdout.
 * Leo prints outputs as: `• <value>`
 */
function parseOutput(output: string): string {
  const match = output.match(/•\s+(.+)/);
  if (!match) throw new Error(`Could not parse Leo output: ${output}`);
  return match[1].trim();
}

/**
 * Generate a compliance proof and compute the trust score for a device.
 * Returns null if the device fails any compliance check.
 */
export async function generateProof(
  metrics: DeviceMetrics,
  programPath: string
): Promise<ProofResult | null> {
  // Step 1: Verify location
  const regionInputs = [
    `{ lat: ${metrics.lat_u64}u64, lng: ${metrics.lng_u64}u64 }`,
    `{ min_lat: ${APPROVED_REGION.min_lat}u64, max_lat: ${APPROVED_REGION.max_lat}u64, min_lng: ${APPROVED_REGION.min_lng}u64, max_lng: ${APPROVED_REGION.max_lng}u64 }`,
    `${metrics.device_id}`,
  ];

  let locationOutput: string;
  try {
    const out = leoRun(programPath, 'verify_compliance', regionInputs);
    locationOutput = parseOutput(out);
  } catch (err) {
    throw new Error(`verify_compliance failed: ${err}`);
  }

  const location_ok = locationOutput === 'true';
  if (!location_ok) {
    return { device_id: metrics.device_id, operator_address: metrics.operator_address, trust_score: 0, location_ok: false, ops_ok: false };
  }

  // Step 2: Verify credentials
  const credInputs = [
    `${metrics.uptime_pct}u64`,
    `${metrics.hashrate_ths}u64`,
    `${MIN_UPTIME}u64`,
    `${MIN_HASHRATE}u64`,
    `${metrics.device_id}`,
  ];

  let credOutput: string;
  try {
    const out = leoRun(programPath, 'verify_device_credentials', credInputs);
    credOutput = parseOutput(out);
  } catch (err) {
    throw new Error(`verify_device_credentials failed: ${err}`);
  }

  const ops_ok = credOutput === 'true';
  if (!ops_ok) {
    return { device_id: metrics.device_id, operator_address: metrics.operator_address, trust_score: 0, location_ok: true, ops_ok: false };
  }

  // Step 3: Compute trust score
  const hashrateScore = normalizeHashrate(metrics.hashrate_ths);
  const scoreInputs = [
    'true',
    'true',
    `${metrics.uptime_pct}u64`,
    `${hashrateScore}u64`,
    `${metrics.device_id}`,
  ];

  let scoreOutput: string;
  try {
    const out = leoRun(programPath, 'compute_node_score', scoreInputs);
    scoreOutput = parseOutput(out);
  } catch (err) {
    throw new Error(`compute_node_score failed: ${err}`);
  }

  // Leo outputs u64 as e.g. "92u64" — strip the type suffix
  const trust_score = parseInt(scoreOutput.replace(/u64$/, ''), 10);
  if (isNaN(trust_score)) throw new Error(`Unexpected score output: ${scoreOutput}`);

  return { device_id: metrics.device_id, operator_address: metrics.operator_address, trust_score, location_ok: true, ops_ok: true };
}
