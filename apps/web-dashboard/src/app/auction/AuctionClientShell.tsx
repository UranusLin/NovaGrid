'use client';

import dynamic from 'next/dynamic';

const AuctionPageContent = dynamic(
  () => import('./AuctionPageContent').then((m) => ({ default: m.AuctionPageContent })),
  { ssr: false }
);

export function AuctionClientShell() {
  return <AuctionPageContent />;
}
