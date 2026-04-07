// Runs in a Web Worker thread — Aleo SDK uses WASM which must not block the UI.
// Proof generation takes 10–30 seconds depending on device hardware.

import type { RegionId } from '../lib/constants';
import { DEFAULT_THRESHOLDS } from '../lib/constants';
import { formatDeviceLocation, formatRegionBounds } from '../lib/aleo';

type WorkerMessage =
  | {
      type: 'VERIFY_COMPLIANCE';
      payload: { lat: number; lng: number; regionId: RegionId; deviceId: string };
    }
  | {
      type: 'VERIFY_CREDENTIALS';
      payload: { uptimePct: number; hashrate: number; deviceId: string };
    }
  | {
      type: 'COMPUTE_SCORE';
      payload: {
        locationOk: boolean;
        opsOk: boolean;
        uptimePct: number;
        hashrateScore: number;
        deviceId: string;
      };
    };

interface ProgramExecutor {
  executeOffline(
    program: string,
    transition: string,
    inputs: string[],
    feeCredits: boolean,
  ): Promise<{ getOutputs(): string[] }>;
}

interface AleoSDKModule {
  ProgramManager: new () => ProgramExecutor;
  default?: () => Promise<void>;
}

// Initialize SDK once at worker startup
let programManager: ProgramExecutor | null = null;

async function getPM(): Promise<ProgramExecutor> {
  if (programManager) return programManager;
  const sdk = (await import('@demox-labs/aleo-sdk')) as unknown as AleoSDKModule;
  if (typeof sdk.default === 'function') {
    await sdk.default();
  }
  programManager = new sdk.ProgramManager();
  return programManager;
}

// Parse and validate a u64 output from Aleo SDK (e.g. "92u64")
function parseU64Output(outputs: string[]): number {
  if (!outputs || outputs.length === 0) {
    throw new Error('Aleo SDK returned no outputs');
  }
  const raw = outputs[0];
  const match = raw.match(/^(\d+)u64$/);
  if (!match) {
    throw new Error(`Unexpected output format from Aleo SDK: "${raw}"`);
  }
  return parseInt(match[1], 10);
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    const pm = await getPM();

    if (type === 'VERIFY_COMPLIANCE') {
      self.postMessage({ type: 'STATUS', message: 'Verifying location...' });

      const inputs = [
        formatDeviceLocation(payload.lat, payload.lng),
        formatRegionBounds(payload.regionId),
        `${payload.deviceId}field`,
      ];

      const result = await pm.executeOffline('compliance.aleo', 'verify_compliance', inputs, false);
      const outputs = result.getOutputs();
      const compliant = Array.isArray(outputs) && outputs[0] === 'true';
      self.postMessage({ type: 'COMPLIANCE_RESULT', compliant });
    }

    if (type === 'VERIFY_CREDENTIALS') {
      self.postMessage({ type: 'STATUS', message: 'Verifying credentials...' });

      // Uses raw hashrate compared against raw threshold (both in same units: TH/s)
      const inputs = [
        `${BigInt(Math.round(payload.uptimePct))}u64`,
        `${BigInt(Math.round(payload.hashrate))}u64`,
        `${DEFAULT_THRESHOLDS.min_uptime}u64`,
        `${DEFAULT_THRESHOLDS.min_hashrate}u64`,
        `${payload.deviceId}field`,
      ];

      const result = await pm.executeOffline('compliance.aleo', 'verify_device_credentials', inputs, false);
      const outputs = result.getOutputs();
      const credentialsOk = Array.isArray(outputs) && outputs[0] === 'true';
      self.postMessage({ type: 'CREDENTIALS_RESULT', credentialsOk });
    }

    if (type === 'COMPUTE_SCORE') {
      self.postMessage({ type: 'STATUS', message: 'Computing trust score...' });

      // hashrateScore is 0-100 normalized score (different from raw hashrate in VERIFY_CREDENTIALS)
      const inputs = [
        payload.locationOk ? 'true' : 'false',
        payload.opsOk ? 'true' : 'false',
        `${BigInt(Math.round(payload.uptimePct))}u64`,
        `${BigInt(Math.round(payload.hashrateScore))}u64`,
        `${payload.deviceId}field`,
      ];

      const result = await pm.executeOffline('compliance.aleo', 'compute_node_score', inputs, false);
      const score = parseU64Output(result.getOutputs());
      self.postMessage({ type: 'SCORE_RESULT', score });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: 'ERROR', message });
  }
};
