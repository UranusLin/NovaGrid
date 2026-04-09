'use client';

import { useAccount } from 'wagmi';
import { useCofheConnection, useCofheNavigateToCreatePermit } from '@cofhe/react';
import '@cofhe/react/styles.css';
import { EncryptedBalance } from '@/components/fhenix/EncryptedBalance';
import { ClaimForm } from '@/components/fhenix/ClaimForm';
import { WeightedDepositForm } from '@/components/fhenix/WeightedDepositForm';
import { NOVA_VAULT_ADDRESS } from '@/lib/contracts';
import { WalletConnectButton } from '@/components/evm/WalletConnectButton';

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <h2 className="text-sm font-semibold text-gray-200">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function RewardsPageContent() {
  const { isConnected, address } = useAccount();
  const connection = useCofheConnection();
  const navigateToCreatePermit = useCofheNavigateToCreatePermit();

  const isCofheConnected = connection.connected;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <a href="/" className="text-xs text-gray-500 hover:text-gray-300">
          ← Dashboard
        </a>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">FHE Rewards</h1>
            <p className="mt-1 text-sm text-gray-500">
              Encrypted reward balances on Fhenix — only you can decrypt your balance.
            </p>
          </div>
          <WalletConnectButton />
        </div>
      </div>

      {/* Contract info */}
      <div className="mb-4 rounded-lg border border-gray-800 px-4 py-2.5 text-xs text-gray-600">
        <span className="text-gray-500">NovaVault</span>{' '}
        <span className="font-mono">{NOVA_VAULT_ADDRESS.slice(0, 10)}…</span>
        {' · '}
        <a
          href={`https://sepolia.etherscan.io/address/${NOVA_VAULT_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className="hover:text-gray-400 underline"
        >
          Ethereum Sepolia
        </a>
      </div>

      {!isConnected ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="mb-4 text-sm text-gray-400">
            Connect MetaMask to view your encrypted rewards.
          </p>
          <WalletConnectButton />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Encrypted balance */}
          <SectionCard
            title="Your Encrypted Balance"
            subtitle="Balances stay encrypted on-chain. Use a permit to decrypt your own values."
          >
            <div className="space-y-3">
              <EncryptedBalance label="Pending balance" functionName="getEncryptedBalance" />
              <EncryptedBalance label="Total earned" functionName="getEncryptedTotalEarned" />

              {!connection.connected && Boolean(connection.connectError) && (
                <button
                  onClick={() => navigateToCreatePermit({ cause: 'clicked_on_confidential_balance' })}
                  className="mt-2 w-full rounded-lg border border-yellow-700/50 bg-yellow-900/20 px-4 py-2 text-xs text-yellow-400 hover:bg-yellow-900/40 transition"
                >
                  Generate permit to decrypt your balance
                </button>
              )}

              {isCofheConnected && address && (
                <p className="text-xs text-gray-600">
                  Connected as{' '}
                  <span className="font-mono">{address.slice(0, 8)}…{address.slice(-6)}</span>
                </p>
              )}
            </div>
          </SectionCard>

          {/* Claim reward */}
          <SectionCard
            title="Claim Reward"
            subtitle="Specify an encrypted amount to subtract from your pending balance."
          >
            <ClaimForm />
          </SectionCard>

          {/* Admin demo: weighted deposit */}
          <SectionCard
            title="ZK→FHE Bridge Demo"
            subtitle="Use the Aleo trust score to weight an encrypted reward deposit. This is the cross-module bridge between the ZK layer and the FHE layer."
          >
            <WeightedDepositForm />
          </SectionCard>
        </div>
      )}

      {/* How it works */}
      <section className="mt-6 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          How it works
        </h2>
        <ol className="space-y-1.5 text-xs text-gray-500">
          <li>
            1. Reward balances are stored as{' '}
            <span className="text-blue-400">euint32 ciphertexts</span> in NovaVault — nobody
            can read them without a permit
          </li>
          <li>
            2. The{' '}
            <span className="text-gray-300">trust score</span> from your Aleo ZK proof is a
            public value that weights how much you earn — high-score nodes earn more
          </li>
          <li>
            3. To decrypt your own balance, sign a Fhenix{' '}
            <span className="text-yellow-400">permit</span> — the CoFHE network returns a
            sealed value only you can open
          </li>
          <li>
            4. Claim by encrypting your desired amount and submitting — the subtraction happens
            inside the FHE co-processor
          </li>
        </ol>
      </section>
    </main>
  );
}
