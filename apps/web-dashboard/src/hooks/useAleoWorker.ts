'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RegionId } from '@/lib/constants';

export type ProofStep = 'idle' | 'location' | 'credentials' | 'score' | 'done' | 'error';

export type ProofState = {
  step: ProofStep;
  statusMessage: string;
  locationOk: boolean | null;
  credentialsOk: boolean | null;
  trustScore: number | null;
  error: string | null;
};

const INITIAL_STATE: ProofState = {
  step: 'idle',
  statusMessage: '',
  locationOk: null,
  credentialsOk: null,
  trustScore: null,
  error: null,
};

export type GenerateProofParams = {
  lat: number;
  lng: number;
  regionId: RegionId;
  uptimePct: number;
  hashrate: number;
  deviceId: string;
};

export function useAleoWorker() {
  const workerRef = useRef<Worker | null>(null);
  const paramsRef = useRef<GenerateProofParams | null>(null);
  const [state, setState] = useState<ProofState>(INITIAL_STATE);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/aleo.worker.ts', import.meta.url),
      { type: 'module' },
    );

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data as Record<string, unknown>;
      const params = paramsRef.current;

      switch (msg.type) {
        case 'STATUS':
          setState((prev) => ({ ...prev, statusMessage: msg.message as string }));
          break;

        case 'COMPLIANCE_RESULT': {
          const compliant = msg.compliant as boolean;
          setState((prev) => ({
            ...prev,
            locationOk: compliant,
            step: compliant ? 'credentials' : 'done',
            statusMessage: compliant
              ? '✓ Location verified. Checking credentials...'
              : '✗ Device location is outside the approved region.',
          }));
          if (compliant && params) {
            workerRef.current?.postMessage({
              type: 'VERIFY_CREDENTIALS',
              payload: {
                uptimePct: params.uptimePct,
                hashrate: params.hashrate,
                deviceId: params.deviceId,
              },
            });
          }
          break;
        }

        case 'CREDENTIALS_RESULT': {
          const credentialsOk = msg.credentialsOk as boolean;
          setState((prev) => ({
            ...prev,
            credentialsOk,
            step: credentialsOk ? 'score' : 'done',
            statusMessage: credentialsOk
              ? '✓ Credentials verified. Computing trust score...'
              : '✗ Device does not meet operational thresholds.',
          }));
          if (credentialsOk && params) {
            const hashrateScore = Math.min(100, Math.round((params.hashrate / 1000) * 100));
            workerRef.current?.postMessage({
              type: 'COMPUTE_SCORE',
              payload: {
                locationOk: true,
                opsOk: true,
                uptimePct: params.uptimePct,
                hashrateScore,
                deviceId: params.deviceId,
              },
            });
          }
          break;
        }

        case 'SCORE_RESULT': {
          const score = msg.score as number;
          setState((prev) => ({
            ...prev,
            trustScore: score,
            step: 'done',
            statusMessage: `✓ Proof complete. Trust score: ${score}/100`,
          }));
          break;
        }

        case 'ERROR':
          setState((prev) => ({
            ...prev,
            step: 'error',
            error: msg.message as string,
            statusMessage: 'Proof generation failed.',
          }));
          break;
      }
    };

    workerRef.current.onmessage = handleMessage;

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const generateFullProof = useCallback((params: GenerateProofParams) => {
    paramsRef.current = params;
    setState({ ...INITIAL_STATE, step: 'location', statusMessage: 'Starting proof generation...' });
    workerRef.current?.postMessage({
      type: 'VERIFY_COMPLIANCE',
      payload: {
        lat: params.lat,
        lng: params.lng,
        regionId: params.regionId,
        deviceId: params.deviceId,
      },
    });
  }, []);

  const reset = useCallback(() => {
    paramsRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  return { ...state, generateFullProof, reset };
}
