'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http, usePublicClient, useWalletClient } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useMemo } from 'react';
import { sepolia } from 'viem/chains';
import { AleoWalletProvider } from '@provablehq/aleo-wallet-adaptor-react';
import { WalletModalProvider } from '@provablehq/aleo-wallet-adaptor-react-ui';
import '@provablehq/aleo-wallet-adaptor-react-ui/dist/styles.css';
import { Network } from '@provablehq/aleo-types';
import { DecryptPermission } from '@provablehq/aleo-wallet-adaptor-core';
import { ShieldWalletAdapter } from '@provablehq/aleo-wallet-adaptor-shield';
import { CofheProvider, createCofheConfig } from '@cofhe/react';
import { sepolia as cofheSepolia } from '@cofhe/sdk/chains';

// Wagmi config — Ethereum Sepolia (Fhenix FHE contracts are deployed here)
const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: { [sepolia.id]: http() },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

// Inner component: uses wagmi hooks to supply viem clients to CofheProvider
function CofheInner({ children }: { children: React.ReactNode }) {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: sepolia.id });

  const cofheConfig = useMemo(
    () =>
      createCofheConfig({
        supportedChains: [cofheSepolia],
        react: {
          autogeneratePermits: true,
          position: 'bottom-right',
          initialTheme: 'dark',
          zIndex: -1,
        },
      }),
    []
  );

  return (
    <CofheProvider
      config={cofheConfig}
      walletClient={walletClient ?? undefined}
      publicClient={publicClient}
    >
      {children}
    </CofheProvider>
  );
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [new ShieldWalletAdapter()], []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <CofheInner>
          <AleoWalletProvider
            wallets={wallets}
            network={Network.TESTNET}
            decryptPermission={DecryptPermission.UponRequest}
            autoConnect={true}
            onError={(error: Error) => console.error('Aleo wallet error:', error)}
          >
            <WalletModalProvider>{children}</WalletModalProvider>
          </AleoWalletProvider>
        </CofheInner>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
