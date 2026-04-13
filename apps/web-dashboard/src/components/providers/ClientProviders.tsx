'use client';

import dynamic from 'next/dynamic';

// ssr: false must live inside a Client Component in Next.js 15+.
// Web3Provider (CoFHE + Aleo SDK) accesses window at module init,
// so it must never run on the server.
const Web3Provider = dynamic(
  () => import('./Web3Provider').then((m) => ({ default: m.Web3Provider })),
  { ssr: false }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}
