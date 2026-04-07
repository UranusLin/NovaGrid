'use client';

import { useState } from 'react';
import { PrivacyLayersPanel } from '@/components/dashboard/PrivacyLayersPanel';

export default function DashboardPage() {
  const [zkScore] = useState<number | null>(null);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">NovaGrid</h1>
        <p className="mt-1 text-sm text-gray-500">
          Privacy-First DePIN Infrastructure — ZK + FHE
        </p>
      </header>

      <div className="grid gap-4">
        <PrivacyLayersPanel
          zkScore={zkScore}
          fheConnected={false}
          daLastSync={null}
        />

        <nav className="grid grid-cols-3 gap-4" aria-label="Module navigation">
          <a
            href="/compliance"
            className="rounded-xl border border-gray-800 bg-gray-900 p-5 transition hover:border-emerald-700"
          >
            <div className="mb-2 text-2xl" aria-hidden="true">🛡</div>
            <div className="font-medium text-gray-200">ZK Compliance</div>
            <div className="mt-1 text-xs text-gray-500">Generate location and credential proofs</div>
          </a>
          <a
            href="/rewards"
            className="rounded-xl border border-gray-800 bg-gray-900 p-5 transition hover:border-blue-700"
          >
            <div className="mb-2 text-2xl" aria-hidden="true">🔐</div>
            <div className="font-medium text-gray-200">FHE Rewards</div>
            <div className="mt-1 text-xs text-gray-500">View and claim encrypted balances</div>
          </a>
          <a
            href="/devices"
            className="rounded-xl border border-gray-800 bg-gray-900 p-5 transition hover:border-gray-600"
          >
            <div className="mb-2 text-2xl" aria-hidden="true">📡</div>
            <div className="font-medium text-gray-200">Devices</div>
            <div className="mt-1 text-xs text-gray-500">Manage registered hardware nodes</div>
          </a>
        </nav>
      </div>
    </main>
  );
}
