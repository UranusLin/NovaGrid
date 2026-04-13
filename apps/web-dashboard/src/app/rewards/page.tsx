import { RewardsClientShell } from './RewardsClientShell';

export const metadata = {
  title: 'FHE Rewards — NovaGrid',
  description: 'Encrypted reward balances on Fhenix — only you can decrypt your balance',
};

export default function RewardsPage() {
  return <RewardsClientShell />;
}
