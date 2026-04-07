'use client';

import { useState } from 'react';
import { APPROVED_REGIONS, DEFAULT_THRESHOLDS } from '@/lib/constants';
import type { RegionId } from '@/lib/constants';
import { useAleoWorker } from '@/hooks/useAleoWorker';
import { ProofStatus } from './ProofStatus';

export function ComplianceProver() {
  const { generateFullProof, reset, ...proofState } = useAleoWorker();

  const [form, setForm] = useState({
    lat: '',
    lng: '',
    regionId: 'taiwan' as RegionId,
    uptimePct: '',
    hashrate: '',
    deviceId: '12345',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    reset();
    generateFullProof({
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      regionId: form.regionId,
      uptimePct: parseInt(form.uptimePct, 10),
      hashrate: parseInt(form.hashrate, 10),
      deviceId: form.deviceId,
    });
  }

  const isGenerating =
    proofState.step === 'location' ||
    proofState.step === 'credentials' ||
    proofState.step === 'score';

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="mb-1 text-lg font-semibold text-gray-100">ZK Compliance Prover</h2>
      <p className="mb-5 text-sm text-gray-500">
        Private inputs never leave your browser. Only the proof result is shared.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
            Approved Region <span className="text-gray-400">(public)</span>
          </label>
          <select
            name="regionId"
            value={form.regionId}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-emerald-500 focus:outline-none"
          >
            {APPROVED_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
            Device GPS Coordinates <span className="text-emerald-500">(private — stays in browser)</span>
          </label>
          <div className="flex gap-2">
            <input
              name="lat"
              value={form.lat}
              onChange={handleChange}
              type="number"
              step="any"
              placeholder="Latitude (e.g. 25.033)"
              required
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
            />
            <input
              name="lng"
              value={form.lng}
              onChange={handleChange}
              type="number"
              step="any"
              placeholder="Longitude (e.g. 121.565)"
              required
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
            Operational Metrics <span className="text-emerald-500">(private — stays in browser)</span>
          </label>
          <p className="mb-2 text-xs text-gray-600">
            Thresholds: uptime ≥ {DEFAULT_THRESHOLDS.min_uptime.toString()}% · hashrate ≥ {DEFAULT_THRESHOLDS.min_hashrate.toString()} TH/s
          </p>
          <div className="flex gap-2">
            <input
              name="uptimePct"
              value={form.uptimePct}
              onChange={handleChange}
              type="number"
              min="0"
              max="100"
              placeholder="Uptime % (e.g. 95)"
              required
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
            />
            <input
              name="hashrate"
              value={form.hashrate}
              onChange={handleChange}
              type="number"
              min="0"
              placeholder="Hashrate TH/s (e.g. 500)"
              required
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? 'Generating ZK Proof...' : 'Generate ZK Proof'}
        </button>
      </form>

      <ProofStatus state={proofState} />
    </div>
  );
}
