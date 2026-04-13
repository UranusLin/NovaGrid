'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useCofheConnection } from '@cofhe/react';
import '@cofhe/react/styles.css';
import { AuctionPanel } from '@/components/fhenix/AuctionPanel';
import { WalletConnectButton } from '@/components/evm/WalletConnectButton';
import { SEALED_BID_AUCTION_ADDRESS } from '@/lib/contracts';

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

export function AuctionPageContent() {
  const { isConnected } = useAccount();
  const connection = useCofheConnection();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-300">
          ← Dashboard
        </Link>
        <div className="mt-2">
          <h1 className="text-2xl font-bold text-gray-100">Sealed Bid Auction</h1>
          <p className="mt-1 text-sm text-gray-500">
            Bid for DePIN network slots with fully encrypted bids — amounts stay private throughout.
          </p>
        </div>
      </div>

      {/* Contract info */}
      <div className="mb-4 rounded-lg border border-gray-800 px-4 py-2.5 text-xs text-gray-600">
        <span className="text-gray-500">SealedBidAuction</span>{' '}
        <span className="font-mono">{SEALED_BID_AUCTION_ADDRESS.slice(0, 10)}…</span>
        {' · '}
        <a
          href={`https://sepolia.etherscan.io/address/${SEALED_BID_AUCTION_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className="hover:text-gray-400 underline"
        >
          Ethereum Sepolia
        </a>
      </div>

      {/* FHE operations badge */}
      <div className="mb-4 flex flex-wrap gap-2">
        {['FHE.gt', 'FHE.eq', 'FHE.select'].map((op) => (
          <span
            key={op}
            className="rounded-full border border-blue-900 bg-blue-950/50 px-2.5 py-0.5 font-mono text-[11px] text-blue-400"
          >
            {op}
          </span>
        ))}
      </div>

      {!isConnected ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="mb-4 text-sm text-gray-400">
            Connect MetaMask to participate in the auction.
          </p>
          <WalletConnectButton />
        </div>
      ) : (
        <div className="space-y-4">
          <SectionCard
            title="Auction"
            subtitle="Bid amounts are encrypted client-side. The auction finds the highest bid using FHE.gt — without ever decrypting any individual amount."
          >
            <AuctionPanel />
          </SectionCard>
        </div>
      )}

      {/* CoFHE connection status */}
      {connection.connected && (
        <p className="mt-3 text-center text-xs text-emerald-600">CoFHE permit active</p>
      )}

      {/* How it works */}
      <section className="mt-6 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          How it works
        </h2>
        <ol className="space-y-1.5 text-xs text-gray-500">
          <li>
            1. Operators submit{' '}
            <span className="text-blue-400">euint32 encrypted bids</span> — amounts are
            sealed before leaving the browser
          </li>
          <li>
            2. The owner calls <span className="text-orange-400">finalizeAuction()</span> — a
            loop uses <span className="text-blue-400">FHE.gt</span> +{' '}
            <span className="text-blue-400">FHE.select</span> to find the encrypted maximum
            without decrypting any bid
          </li>
          <li>
            3. Each bidder calls <span className="text-purple-400">checkWinStatus()</span> —{' '}
            <span className="text-blue-400">FHE.eq</span> compares their bid to the encrypted
            max, producing an encrypted result (1 = winner)
          </li>
          <li>
            4. Sign a Fhenix <span className="text-yellow-400">permit</span> to decrypt only
            your result — losing bids are never revealed
          </li>
        </ol>
      </section>
    </main>
  );
}
