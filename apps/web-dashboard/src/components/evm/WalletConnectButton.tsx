'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useChains } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { sepolia } from 'viem/chains';

export function WalletConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const chains = useChains();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isWrongNetwork = isConnected && chainId !== sepolia.id;
  const currentChain = chains.find((c) => c.id === chainId);
  const networkName = currentChain?.name ?? `Chain ${chainId}`;

  if (isWrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: sepolia.id })}
        disabled={isSwitching}
        className="rounded-lg border border-yellow-700 bg-yellow-900/20 px-3 py-1.5 text-xs font-medium text-yellow-400 transition hover:bg-yellow-900/40 disabled:opacity-50"
      >
        {isSwitching ? 'Switching…' : 'Switch to Sepolia'}
      </button>
    );
  }

  if (!isConnected || !address) {
    return (
      <button
        onClick={() => connect({ connector: injected() })}
        disabled={isConnecting}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {isConnecting ? 'Connecting…' : 'Connect Wallet'}
      </button>
    );
  }

  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 font-mono text-xs text-gray-300 transition hover:border-gray-500"
      >
        {short}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-xl">
          {/* Network indicator */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800">
            <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-xs text-gray-400">{networkName}</span>
          </div>

          <button
            onClick={() => { navigator.clipboard.writeText(address); setOpen(false); }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
          >
            Copy address
          </button>
          <button
            onClick={() => { connect({ connector: injected() }); setOpen(false); }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
          >
            Change wallet
          </button>
          <button
            onClick={() => { disconnect(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-red-400"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
