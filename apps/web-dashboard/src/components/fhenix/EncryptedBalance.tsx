'use client';

import { useAccount, useReadContract } from 'wagmi';
import { sepolia } from 'viem/chains';
import { useCofheReadContractAndDecrypt } from '@cofhe/react';
import { FheTypes } from '@cofhe/sdk';
import { NOVA_VAULT_ABI, NOVA_VAULT_ADDRESS } from '@/lib/contracts';

type Props = {
  label: string;
  functionName: 'getEncryptedBalance' | 'getEncryptedTotalEarned';
};

export function EncryptedBalance({ label, functionName }: Props) {
  const { address, isConnected } = useAccount();

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

  const handleStr = encrypted.data
    ? `0x${(encrypted.data as bigint).toString(16).slice(0, 10)}…`
    : null;

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
        {encrypted.isLoading && (
          <span className="text-xs text-gray-500">Loading…</span>
        )}
        {encrypted.error && (
          <span className="text-xs text-red-500">Read error</span>
        )}
        {!encrypted.isLoading && !encrypted.error && (
          <>
            {decrypted.isLoading ? (
              <span className="text-xs text-gray-400">Decrypting…</span>
            ) : decrypted.data !== undefined ? (
              <span className="text-base font-semibold text-emerald-400">
                {String(decrypted.data)} units
              </span>
            ) : disabledDueToMissingPermit ? (
              <span className="text-xs text-yellow-500">Permit required</span>
            ) : (
              <span className="text-sm text-gray-400">Encrypted 🔒</span>
            )}
            {decrypted.error && (
              <p className="text-xs text-red-400">Decrypt failed</p>
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
        {isLoading && 'Loading…'}
        {error && <span className="text-red-400">Error</span>}
        {data && !isLoading && 'Encrypted 🔒'}
        {!data && !isLoading && !error && '—'}
      </span>
    </div>
  );
}
