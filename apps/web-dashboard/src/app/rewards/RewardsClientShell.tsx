'use client';

import dynamic from 'next/dynamic';

// ssr: false must live in a Client Component (Next.js 15 rule).
const RewardsPageContent = dynamic(
  () => import('./RewardsPageContent').then((m) => ({ default: m.RewardsPageContent })),
  { ssr: false }
);

export function RewardsClientShell() {
  return <RewardsPageContent />;
}
