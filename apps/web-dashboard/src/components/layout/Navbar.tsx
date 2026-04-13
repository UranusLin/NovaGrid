'use client';

import { WalletMultiButton } from '@provablehq/aleo-wallet-adaptor-react-ui';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { WalletConnectButton } from '@/components/evm/WalletConnectButton';

function AleoNetworkBadge() {
  const { connected, network } = useWallet();
  if (!connected || !network) return null;
  const label = network === 'testnet' ? 'Testnet' : network === 'mainnet' ? 'Mainnet' : network;
  return (
    <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] border border-gray-700 text-gray-500">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      {label}
    </span>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <a href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.svg" alt="NovaGrid" width={28} height={28} />
          <span className="text-lg font-bold text-gray-100">Nova<span className="text-blue-400">Grid</span></span>
          <span className="rounded border border-gray-700 px-1.5 py-0.5 text-[10px] text-gray-500">
            DePIN
          </span>
        </a>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="aleo-wallet-btn">
              <WalletMultiButton />
            </div>
            <AleoNetworkBadge />
          </div>
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
