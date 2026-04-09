'use client';

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { sepolia } from 'viem/chains';

export function WalletConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== sepolia.id;

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

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 font-mono text-xs text-gray-300 transition hover:border-red-700 hover:text-red-400"
      >
        {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    );
  }

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
