'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { sepolia } from 'viem/chains';
import { useCofheEncryptAndWriteContract } from '@cofhe/react';
import { Encryptable } from '@cofhe/sdk';
import { NOVA_VAULT_ABI, NOVA_VAULT_ADDRESS } from '@/lib/contracts';


export function ClaimForm() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { encryptAndWrite, encryption, write } = useCofheEncryptAndWriteContract();

  const isLoading = encryption.isPending || write.isPending;

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setTxHash(null);

    const parsed = parseInt(amount, 10);
    if (isNaN(parsed) || parsed <= 0) {
      setFormError('Enter a valid positive integer amount.');
      return;
    }
    if (parsed > 4_294_967_295) {
      setFormError('Amount exceeds maximum uint32 value.');
      return;
    }

    try {
      const hash = await encryptAndWrite({
        params: {
          address: NOVA_VAULT_ADDRESS,
          abi: NOVA_VAULT_ABI,
          functionName: 'claimReward',
          account: address!,
          chain: sepolia,
        },
        args: [Encryptable.uint32(BigInt(parsed))],
      });
      setTxHash(hash);
      setAmount('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  }

  if (!isConnected) {
    return (
      <p className="text-center text-sm text-gray-500">
        Connect your wallet to claim rewards.
      </p>
    );
  }

  return (
    <form onSubmit={handleClaim} className="space-y-4">
      <div>
        <label htmlFor="claim-amount" className="block text-sm text-gray-400">
          Claim amount (units)
        </label>
        <input
          id="claim-amount"
          type="number"
          min={1}
          max={4294967295}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 200"
          className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
          required
        />
        <p className="mt-1 text-xs text-gray-600">
          The amount is encrypted client-side before being submitted on-chain.
        </p>
      </div>

      {formError && (
        <p className="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400">
          {formError}
        </p>
      )}

      {txHash && (
        <p className="rounded-lg bg-emerald-900/30 px-3 py-2 text-xs text-emerald-400">
          Claim submitted:{' '}
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {txHash.slice(0, 12)}…
          </a>
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Encrypting + Submitting…' : 'Encrypt & Claim'}
      </button>

      {encryption.isPending && (
        <p className="text-center text-xs text-gray-500">
          Generating encrypted claim proof…
        </p>
      )}
    </form>
  );
}
