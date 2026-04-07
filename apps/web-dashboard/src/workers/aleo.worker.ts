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

async function getProgramManager() {
  const sdk = await import('@demox-labs/aleo-sdk');
  if (sdk.default && typeof sdk.default === 'function') {
    await sdk.default();
  }
  return sdk.ProgramManager;
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    const ProgramManager = await getProgramManager();
    const pm = new ProgramManager();

    if (type === 'VERIFY_COMPLIANCE') {
      self.postMessage({ type: 'STATUS', message: 'Verifying location...' });

      const inputs = [
        formatDeviceLocation(payload.lat, payload.lng),
        formatRegionBounds(payload.regionId),
        `${payload.deviceId}field`,
      ];

      const result = await pm.executeOffline(
        'compliance.aleo',
        'verify_compliance',
        inputs,
        false,
      );

      const outputs = result.getOutputs();
      const compliant = outputs[0] === 'true';
      self.postMessage({ type: 'COMPLIANCE_RESULT', compliant });
    }

    if (type === 'VERIFY_CREDENTIALS') {
      self.postMessage({ type: 'STATUS', message: 'Verifying credentials...' });

      const inputs = [
        `${BigInt(Math.round(payload.uptimePct))}u64`,
        `${BigInt(Math.round(payload.hashrate))}u64`,
        `${DEFAULT_THRESHOLDS.min_uptime}u64`,
        `${DEFAULT_THRESHOLDS.min_hashrate}u64`,
        `${payload.deviceId}field`,
      ];

      const result = await pm.executeOffline(
        'compliance.aleo',
        'verify_device_credentials',
        inputs,
        false,
      );

      const outputs = result.getOutputs();
      const credentialsOk = outputs[0] === 'true';
      self.postMessage({ type: 'CREDENTIALS_RESULT', credentialsOk });
    }

    if (type === 'COMPUTE_SCORE') {
      self.postMessage({ type: 'STATUS', message: 'Computing trust score...' });

      const inputs = [
        payload.locationOk ? 'true' : 'false',
        payload.opsOk ? 'true' : 'false',
        `${BigInt(Math.round(payload.uptimePct))}u64`,
        `${BigInt(Math.round(payload.hashrateScore))}u64`,
        `${payload.deviceId}field`,
      ];

      const result = await pm.executeOffline(
        'compliance.aleo',
        'compute_node_score',
        inputs,
        false,
      );

      const outputs = result.getOutputs();
      const scoreStr = outputs[0] ?? '0u64';
      const score = parseInt(scoreStr.replace('u64', ''), 10);
      self.postMessage({ type: 'SCORE_RESULT', score });
    }
  } catch (err) {
    self.postMessage({ type: 'ERROR', message: (err as Error).message });
  }
};
