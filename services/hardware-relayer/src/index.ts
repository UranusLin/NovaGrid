/**
 * NovaGrid Hardware Relayer
 *
 * Module B: bridges physical DePIN hardware nodes to the Aleo + Fhenix smart contract layers.
 *
 * API:
 *   POST /api/v1/report
 *     Body: DeviceMetrics JSON
 *     - Validates device metrics
 *     - Runs compliance.aleo ZK proof pipeline (verify_compliance → verify_device_credentials → compute_node_score)
 *     - If compliant: submits trust-score-weighted reward to RewardDistributor on Fhenix (Ethereum Sepolia)
 *     - Returns proof result + transaction hash
 *
 *   GET /health
 *     Returns service health status
 *
 * Environment variables:
 *   PORT                     - HTTP port (default: 3001)
 *   ALEO_PROGRAM_PATH        - Absolute path to the aleo-compliance Leo project root
 *   EVM_PRIVATE_KEY          - Owner private key for Fhenix contract calls
 *   SEPOLIA_RPC_URL          - Ethereum Sepolia RPC endpoint
 *   REWARD_DISTRIBUTOR_ADDRESS - RewardDistributor contract address (optional override)
 *   BASE_REWARD_UNIT         - Base reward units per submission (default: 10)
 *   API_KEY                  - Shared secret for device authentication (required in production)
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { DeviceMetricsSchema } from './types.js';
import { generateProof } from './aleoProver.js';
import { submitWeightedReward } from './fhenixSubmitter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

// ─── Auth middleware ──────────────────────────────────────────────────────────

function requireApiKey(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // No key configured → allow all (development mode)
    next();
    return;
  }
  const provided = req.headers['x-api-key'];
  if (provided !== apiKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'novagrid-hardware-relayer', version: '0.1.0' });
});

/**
 * POST /api/v1/report
 *
 * Accepts device metrics, runs the Aleo compliance proof, and submits the
 * trust-score-weighted reward to the Fhenix contract if the device passes.
 */
app.post('/api/v1/report', requireApiKey, async (req, res) => {
  // 1. Validate input
  const parsed = DeviceMetricsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid device metrics', details: parsed.error.issues });
    return;
  }
  const metrics = parsed.data;

  // 2. Resolve the Aleo program path
  const programPath =
    process.env.ALEO_PROGRAM_PATH ??
    path.resolve(__dirname, '../../../contracts/aleo-compliance');

  // 3. Run Aleo compliance proof
  let proofResult;
  try {
    proofResult = await generateProof(metrics, programPath);
  } catch (err) {
    console.error('[relayer] Proof generation failed:', err);
    res.status(500).json({ error: 'Proof generation failed', detail: String(err) });
    return;
  }

  if (!proofResult) {
    res.status(422).json({ error: 'Device failed compliance check' });
    return;
  }

  if (!proofResult.location_ok || !proofResult.ops_ok) {
    res.status(200).json({
      compliant: false,
      location_ok: proofResult.location_ok,
      ops_ok: proofResult.ops_ok,
      trust_score: null,
      tx_hash: null,
    });
    return;
  }

  // 4. Submit to Fhenix RewardDistributor
  let txHash: `0x${string}`;
  try {
    txHash = await submitWeightedReward(proofResult);
  } catch (err) {
    console.error('[relayer] Fhenix submission failed:', err);
    res.status(500).json({ error: 'Fhenix submission failed', detail: String(err) });
    return;
  }

  console.log(
    `[relayer] Reward submitted | device=${metrics.device_id} | score=${proofResult.trust_score} | tx=${txHash}`
  );

  res.json({
    compliant: true,
    location_ok: true,
    ops_ok: true,
    trust_score: proofResult.trust_score,
    tx_hash: txHash,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3001', 10);
app.listen(PORT, () => {
  console.log(`[relayer] Hardware relayer listening on port ${PORT}`);
  console.log(`[relayer] Program path: ${process.env.ALEO_PROGRAM_PATH ?? '(default — relative to source)'}`);
  console.log(`[relayer] Auth: ${process.env.API_KEY ? 'API key required' : 'OPEN (set API_KEY in production)'}`);
});
