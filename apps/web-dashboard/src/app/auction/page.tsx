import { AuctionClientShell } from './AuctionClientShell';

export const metadata = {
  title: 'Sealed Bid Auction — NovaGrid',
  description: 'Privacy-preserving slot auction — encrypted bids, FHE max selection, private win status',
};

export default function AuctionPage() {
  return <AuctionClientShell />;
}
