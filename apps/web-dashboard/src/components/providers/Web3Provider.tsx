'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useMemo } from 'react';
import { AleoWalletProvider } from '@provablehq/aleo-wallet-adaptor-react';
import { WalletModalProvider } from '@provablehq/aleo-wallet-adaptor-react-ui';
import '@provablehq/aleo-wallet-adaptor-react-ui/dist/styles.css';
import { Network } from '@provablehq/aleo-types';
import { DecryptPermission } from '@provablehq/aleo-wallet-adaptor-core';
import { ShieldWalletAdapter } from '@provablehq/aleo-wallet-adaptor-shield';

// Fhenix Helium testnet configuration
const fhenixHelium = {
  id: 8008135,
  name: 'Fhenix Helium',
  nativeCurrency: { name: 'tFHE', symbol: 'tFHE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.helium.fhenix.zone'] },
  },
  blockExplorers: {
    default: { name: 'Fhenix Explorer', url: 'https://explorer.helium.fhenix.zone' },
  },
} as const;

const wagmiConfig = createConfig({
  chains: [fhenixHelium],
  connectors: [injected()],
  transports: { [fhenixHelium.id]: http() },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [new ShieldWalletAdapter()], []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AleoWalletProvider
          wallets={wallets}
          network={Network.TESTNET}
          decryptPermission={DecryptPermission.UponRequest}
          autoConnect={false}
          onError={(error: Error) => console.error('Wallet error:', error)}
        >
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </AleoWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
