import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'NovaGrid — Privacy-First DePIN Infrastructure',
  description:
    'Run hardware nodes with full privacy. ZK proofs verify compliance without revealing your location. FHE keeps your rewards encrypted on-chain. Built on Aleo, Fhenix, and 0G.',
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-gray-700 px-3 py-0.5 text-xs text-gray-500">
      {children}
    </span>
  );
}

function FeatureCard({
  icon,
  title,
  chain,
  description,
  bullets,
  color,
}: {
  icon: string;
  title: string;
  chain: string;
  description: string;
  bullets: string[];
  color: string;
}) {
  return (
    <div className={`rounded-2xl border ${color} bg-gray-900/60 p-6`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <div className="font-semibold text-gray-100">{title}</div>
          <div className="text-xs text-gray-500">{chain}</div>
        </div>
      </div>
      <p className="mb-4 text-sm text-gray-400">{description}</p>
      <ul className="space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-xs text-gray-500">
            <span className="mt-0.5 text-gray-600">→</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-gray-700 text-xs font-bold text-gray-500">
      {n}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-20 text-center">
        <div className="mb-8 flex justify-center">
          <img src="/logo.svg" alt="NovaGrid" width={64} height={64} />
        </div>

        <div className="mb-6 flex flex-wrap justify-center gap-2">
          <Badge>Privacy Infrastructure Layer</Badge>
          <Badge>Aleo ZK · Fhenix FHE · 0G DA</Badge>
        </div>

        <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-100">
          The privacy layer
          <br />
          <span className="text-blue-400">every DePIN network needs.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-400">
          NovaGrid is not another DePIN network — it's the privacy infrastructure
          layer that plugs into existing ones. Hardware nodes prove compliance
          with ZK, earn rewards stored as FHE ciphertexts, and relay data
          through 0G. No location, identity, or balance ever exposed.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Launch App →
          </Link>
          <a
            href="#how-it-works"
            className="rounded-xl border border-gray-700 px-8 py-3 text-sm font-medium text-gray-300 transition hover:border-gray-500 hover:text-gray-100"
          >
            How it works
          </a>
        </div>
      </section>

      {/* ── Problem → Solution ───────────────────────────────────────── */}
      <section className="border-y border-gray-800 bg-gray-900/40 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-500">
                Every DePIN protocol today
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>📍 Requires public GPS to verify node eligibility</li>
                <li>💰 Reward balances visible to anyone on-chain</li>
                <li>🔓 Competitors can track your nodes and earnings</li>
              </ul>
            </div>
            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-500">
                With NovaGrid privacy layer
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>🛡 ZK proof confirms eligibility — GPS never leaves your device</li>
                <li>🔐 FHE keeps balances encrypted — even the contract can't read them</li>
                <li>📡 0G stores relay data without central custody</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold text-gray-100">
          How it works
        </h2>
        <div className="space-y-6">
          {[
            {
              step: 1,
              title: 'Node proves compliance with ZK',
              body: 'Your hardware node submits GPS coordinates and uptime metrics as private inputs to an Aleo program. The ZK proof confirms you\'re in an approved region and meeting performance thresholds — without revealing the actual values.',
              tag: 'Aleo · Leo Programs',
            },
            {
              step: 2,
              title: 'Trust score weights your encrypted reward',
              body: 'The public trust score (0–100) from your ZK proof determines your reward weight. The reward is deposited as an euint32 ciphertext into NovaVault on Fhenix — only you can ever decrypt it.',
              tag: 'Fhenix · FHE Co-Processor',
            },
            {
              step: 3,
              title: 'Claim rewards privately',
              body: 'Sign a Fhenix permit in your browser. The CoFHE network returns a sealed value only your key can open. Claim by submitting an encrypted amount — the subtraction happens inside the FHE co-processor with no plaintext ever on-chain.',
              tag: 'Fhenix · CoFHE Permits',
            },
            {
              step: 4,
              title: 'Relay data persists on 0G',
              body: 'Device telemetry is pushed to 0G\'s decentralized data availability layer. No central server, no single point of failure — just verifiable, censorship-resistant storage.',
              tag: '0G · Data Availability',
            },
          ].map(({ step, title, body, tag }) => (
            <div key={step} className="flex gap-4">
              <StepBadge n={step} />
              <div className="flex-1 rounded-xl border border-gray-800 bg-gray-900/50 p-5">
                <div className="mb-1 flex items-center justify-between">
                  <div className="font-medium text-gray-200">{title}</div>
                  <span className="text-[10px] text-gray-600">{tag}</span>
                </div>
                <p className="text-sm text-gray-500">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Three modules ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 pb-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-100">
          Three privacy layers, one operator experience
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard
            icon="🛡"
            title="ZK Compliance"
            chain="Aleo"
            color="border-emerald-900/50"
            description="Zero-knowledge proofs run entirely in your browser via a Web Worker."
            bullets={[
              'Location verified without revealing coordinates',
              'Uptime & hashrate checked without leaking metrics',
              'Trust score (0–100) is the only public output',
            ]}
          />
          <FeatureCard
            icon="🔐"
            title="FHE Rewards"
            chain="Fhenix"
            color="border-blue-900/50"
            description="Balances live as encrypted ciphertexts. Even the contract can't read them."
            bullets={[
              'euint32 on-chain — nobody sees your balance',
              'Claim with encrypted subtraction inside the FHE co-processor',
              'Permit-based decryption — only you can see your value',
            ]}
          />
          <FeatureCard
            icon="📡"
            title="DA Layer"
            chain="0G"
            color="border-gray-700/50"
            description="Device telemetry stored on a decentralized data availability layer."
            bullets={[
              'No central relay server',
              'Verifiable data submission',
              'Censorship-resistant hardware logs',
            ]}
          />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="border-t border-gray-800 py-16 text-center">
        <h2 className="mb-3 text-2xl font-bold text-gray-100">
          Ready to run a private node?
        </h2>
        <p className="mb-8 text-sm text-gray-500">
          Connect your wallets and start proving compliance in under 2 minutes.
        </p>
        <Link
          href="/dashboard"
          className="rounded-xl bg-blue-600 px-10 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Launch App →
        </Link>
      </section>
    </div>
  );
}
