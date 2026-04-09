'use client';

import { useAccount, useReadContract } from 'wagmi';
import { sepolia } from 'viem/chains';
import { useCofheReadContractAndDecrypt, useCofheNavigateToCreatePermit } from '@cofhe/react';
import { FheTypes } from '@cofhe/sdk';
import { NOVA_VAULT_ABI, NOVA_VAULT_ADDRESS } from '@/lib/contracts';
import { humanizeFheError } from '@/lib/fheErrors';

type Props = {
  label: string;
  functionName: 'getEncryptedBalance' | 'getEncryptedTotalEarned';
};

export function EncryptedBalance({ label, functionName }: Props) {
  const { address, isConnected } = useAccount();
  const navigateToCreatePermit = useCofheNavigateToCreatePermit();

  const { encrypted, decrypted, disabledDueToMissingPermit } =
    useCofheReadContractAndDecrypt<
      typeof NOVA_VAULT_ABI,
      typeof functionName,
      FheTypes.Uint32
    >(
      {
        address: NOVA_VAULT_ADDRESS,
        abi: NOVA_VAULT_ABI,
        functionName,
        args: address ? [address] : undefined,
        requiresPermit: true,
      },
      {
        readQueryOptions: { enabled: isConnected && !!address },
      }
    );

  if (!isConnected || !address) {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-xs text-gray-600">Wallet not connected</span>
      </div>
    );
  }

  // Loading skeleton while fetching the encrypted handle
  if (encrypted.isLoading) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 animate-pulse rounded bg-gray-700" />
          <div className="h-2.5 w-20 animate-pulse rounded bg-gray-800" />
        </div>
        <div className="h-5 w-16 animate-pulse rounded bg-gray-700" />
      </div>
    );
  }

  const handleStr = encrypted.data
    ? `0x${(encrypted.data as bigint).toString(16).slice(0, 10)}…`
    : null;

  // Permit is expired when decryption errors but we have an encrypted handle
  const isExpiredPermit =
    !disabledDueToMissingPermit &&
    Boolean(decrypted.error) &&
    Boolean(encrypted.data);

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-300">{label}</p>
        {handleStr && (
          <p className="mt-0.5 font-mono text-xs text-gray-600">
            handle: {handleStr}
          </p>
        )}
      </div>

      <div className="text-right">
        {encrypted.error && (
          <span className="text-xs text-red-500">Read error</span>
        )}
        {!encrypted.error && (
          <>
            {decrypted.isLoading ? (
              <div className="h-5 w-16 animate-pulse rounded bg-gray-700" />
            ) : decrypted.data !== undefined ? (
              <span className="text-base font-semibold text-emerald-400">
                {String(decrypted.data)} units
              </span>
            ) : disabledDueToMissingPermit ? (
              <button
                onClick={() => navigateToCreatePermit({ cause: 'clicked_on_confidential_balance' })}
                className="rounded bg-yellow-900/30 px-2 py-1 text-xs text-yellow-400 transition hover:bg-yellow-900/50"
              >
                Sign permit
              </button>
            ) : isExpiredPermit ? (
              <button
                onClick={() => navigateToCreatePermit({ cause: 'clicked_on_confidential_balance' })}
                className="rounded bg-orange-900/30 px-2 py-1 text-xs text-orange-400 transition hover:bg-orange-900/50"
                title={humanizeFheError(decrypted.error)}
              >
                Refresh permit
              </button>
            ) : !encrypted.data ? (
              <span className="text-sm text-gray-500">No balance</span>
            ) : (
              <span className="text-sm text-gray-400">Encrypted 🔒</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Simpler read-only view: shows encrypted handle without auto-decrypt
export function EncryptedHandleView({ label, functionName }: Props) {
  const { address, isConnected } = useAccount();

  const { data, isLoading, error } = useReadContract({
    address: NOVA_VAULT_ADDRESS,
    abi: NOVA_VAULT_ABI,
    functionName,
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: { enabled: isConnected && !!address },
  });

  if (!isConnected) return null;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-gray-300">
        {isLoading && <span className="h-4 w-12 animate-pulse rounded bg-gray-700 inline-block" />}
        {error && <span className="text-red-400">Error</span>}
        {data && !isLoading && 'Encrypted 🔒'}
        {!data && !isLoading && !error && '—'}
      </span>
    </div>
  );
}
