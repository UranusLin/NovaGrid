import { ComplianceProver } from '@/components/aleo/ComplianceProver';
import { WalletButton } from '@/components/aleo/WalletButton';

export const metadata = {
  title: 'ZK Compliance — NovaGrid',
  description: 'Prove device compliance without revealing location or operational data',
};

export default function CompliancePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <a href="/" className="text-xs text-gray-500 hover:text-gray-300">
          ← Dashboard
        </a>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-100">ZK Compliance Prover</h1>
          <WalletButton />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Prove your device is compliant without revealing its location or performance metrics.
          Zero-knowledge proofs run entirely in your browser.
        </p>
      </div>

      <ComplianceProver />

      <section className="mt-6 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          How It Works
        </h2>
        <ol className="space-y-1 text-xs text-gray-500">
          <li>
            1. Your GPS coordinates and metrics are{' '}
            <span className="text-emerald-400">private inputs</span> — never transmitted
          </li>
          <li>
            2. The approved region bounds are{' '}
            <span className="text-gray-300">public inputs</span> — visible to verifiers
          </li>
          <li>
            3. Aleo zero-knowledge proofs run in a Web Worker inside your browser
          </li>
          <li>
            4. The public trust score (0–100) can be used for reward weighting on Fhenix
          </li>
        </ol>
      </section>
    </main>
  );
}
