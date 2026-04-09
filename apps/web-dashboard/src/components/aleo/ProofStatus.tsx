'use client';

import type { ProofState } from '@/hooks/useAleoWorker';

type Props = { state: ProofState };

const STEP_LABELS: Partial<Record<ProofState['step'], string>> = {
  location: 'Verifying location...',
  credentials: 'Verifying credentials...',
  score: 'Computing trust score...',
  done: 'Proof complete',
  error: 'Proof failed',
};

export function ProofStatus({ state }: Props) {
  if (state.step === 'idle') return null;

  const isRunning = state.step === 'location' || state.step === 'credentials' || state.step === 'score';

  return (
    <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="mb-3 flex items-center gap-2">
        {isRunning && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-emerald-400" />
        )}
        <span className="text-sm font-medium text-gray-300">
          {STEP_LABELS[state.step] ?? ''}
        </span>
      </div>

      {state.statusMessage && (
        <p className="text-xs text-gray-400">{state.statusMessage}</p>
      )}

      {state.step === 'done' && (
        <div className="mt-3 space-y-2 border-t border-gray-700 pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Location Compliance</span>
            <span className={state.locationOk ? 'text-emerald-400' : 'text-red-400'}>
              {state.locationOk ? '✓ Compliant' : '✗ Non-compliant'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Operational Credentials</span>
            <span className={state.credentialsOk ? 'text-emerald-400' : 'text-red-400'}>
              {state.credentialsOk ? '✓ Meets thresholds' : '✗ Below thresholds'}
            </span>
          </div>
          {state.trustScore !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Trust Score</span>
              <span className="font-bold text-emerald-400">{state.trustScore}/100</span>
            </div>
          )}
          {/* ZK→FHE bridge CTA: guide user to use their trust score on Fhenix */}
          {state.trustScore !== null && state.locationOk && state.credentialsOk && (
            <div className="mt-3 rounded-lg border border-emerald-800/50 bg-emerald-900/20 px-4 py-3">
              <p className="mb-2 text-xs text-emerald-400">
                Trust score saved locally. Use it to weight your encrypted reward deposit on Fhenix.
              </p>
              <a
                href="/rewards"
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-600"
              >
                Use Score in FHE Rewards →
              </a>
            </div>
          )}
        </div>
      )}

      {state.step === 'error' && (
        <p className="mt-2 rounded bg-red-950 px-3 py-2 text-xs text-red-300">
          {state.error}
        </p>
      )}
    </div>
  );
}
