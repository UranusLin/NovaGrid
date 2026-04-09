import dynamic from 'next/dynamic';

// @cofhe/react accesses window at module init — must be loaded client-only.
const RewardsPageContent = dynamic(
  () => import('./RewardsPageContent').then((m) => ({ default: m.RewardsPageContent })),
  { ssr: false }
);

export const metadata = {
  title: 'FHE Rewards — NovaGrid',
  description: 'Encrypted reward balances on Fhenix — only you can decrypt your balance',
};

export default function RewardsPage() {
  return <RewardsPageContent />;
}
