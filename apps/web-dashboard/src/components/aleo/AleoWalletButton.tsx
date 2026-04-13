'use client';

import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { useWalletModal } from '@provablehq/aleo-wallet-adaptor-react-ui';

export function AleoWalletButton() {
  const { connected, publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    const short = `${publicKey.slice(0, 6)}…${publicKey.slice(-4)}`;
    return (
      <button
        onClick={() => disconnect()}
        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 font-mono text-xs text-gray-300 transition hover:border-red-700 hover:text-red-400"
      >
        aleo:{short}
      </button>
    );
  }

  return (
    <button
      onClick={() => setVisible(true)}
      disabled={connecting}
      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
    >
      {connecting ? 'Connecting…' : 'Connect Aleo'}
    </button>
  );
}
