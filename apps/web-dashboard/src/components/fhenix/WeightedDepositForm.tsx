'use client';

import { useEffect, useState } from 'react';
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi';
import { sepolia } from 'viem/chains';
import { useCofheEncryptAndWriteContract } from '@cofhe/react';
import { Encryptable } from '@cofhe/sdk';
import { REWARD_DISTRIBUTOR_ABI, REWARD_DISTRIBUTOR_ADDRESS } from '@/lib/contracts';
import { humanizeFheError } from '@/lib/fheErrors';

export function WeightedDepositForm() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [operator, setOperator] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { encryptAndWrite, encryption, write } = useCofheEncryptAndWriteContract();

  // Poll for confirmation after submission
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
  });

  const isWrongNetwork = isConnected && chainId !== sepolia.id;
  const isLoading = encryption.isPending || write.isPending;

  // Pre-fill operator with connected address
  useEffect(() => {
    if (address && !operator) setOperator(address);
  }, [address, operator]);

  // Read cached trust score from localStorage (produced by ZK proof)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('novagrid:zkTrustScore');
      if (raw !== null) setTrustScore(Number(raw));
    } catch {
      // localStorage unavailable
    }
  }, []);

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setTxHash(null);

    if (!operator.match(/^0x[0-9a-fA-F]{40}$/)) {
      setFormError('Enter a valid Ethereum address for the operator.');
      return;
    }

    const parsedAmount = parseInt(baseAmount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Enter a valid positive integer base amount.');
      return;
    }

    if (trustScore === null || trustScore < 40 || trustScore > 100) {
      setFormError('Trust score must be between 40 and 100. Generate a ZK proof first.');
      return;
    }

    try {
      const hash = await encryptAndWrite({
        params: {
          address: REWARD_DISTRIBUTOR_ADDRESS,
          abi: REWARD_DISTRIBUTOR_ABI,
          functionName: 'distributeWeightedReward',
          account: address!,
          chain: sepolia,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: [operator as `0x${string}`, Encryptable.uint32(BigInt(parsedAmount)), BigInt(trustScore)] as any,
      });
      setTxHash(hash as `0x${string}`);
      setBaseAmount('');
    } catch (err) {
      setFormError(humanizeFheError(err));
    }
  }

  if (!isConnected) {
    return (
      <p className="text-center text-sm text-gray-500">
        Connect your wallet to use the admin demo.
      </p>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="text-center">
        <p className="mb-3 text-sm text-yellow-400">
          Switch to Ethereum Sepolia to submit FHE transactions.
        </p>
        <button
          onClick={() => switchChain({ chainId: sepolia.id })}
          disabled={isSwitching}
          className="rounded-lg border border-yellow-700 bg-yellow-900/20 px-4 py-2 text-sm text-yellow-400 transition hover:bg-yellow-900/40 disabled:opacity-50"
        >
          {isSwitching ? 'Switching…' : 'Switch to Sepolia'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleDeposit} className="space-y-4">
      {/* Trust score display */}
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">ZK Trust Score (from Aleo proof)</span>
          {trustScore !== null ? (
            <span className="font-semibold text-emerald-400">{trustScore}/100</span>
          ) : (
            <span className="text-xs text-gray-600">
              No proof yet —{' '}
              <a href="/compliance" className="underline text-gray-500 hover:text-gray-300">
                generate one
              </a>
            </span>
          )}
        </div>
        {trustScore !== null && (
          <p className="mt-1 text-xs text-gray-600">
            Weighted deposit = base amount × {trustScore} (individual amounts remain private)
          </p>
        )}
      </div>

      <div>
        <label htmlFor="operator-address" className="block text-sm text-gray-400">
          Operator address
        </label>
        <input
          id="operator-address"
          type="text"
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          placeholder="0x..."
          className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-xs text-gray-200 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>

      <div>
        <label htmlFor="base-amount" className="block text-sm text-gray-400">
          Base amount (units per score point)
        </label>
        <input
          id="base-amount"
          type="number"
          min={1}
          max={1000000}
          step={1}
          value={baseAmount}
          onChange={(e) => setBaseAmount(e.target.value)}
          placeholder="e.g. 10"
          className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
          required
        />
        {trustScore !== null && baseAmount && !isNaN(parseInt(baseAmount)) && (
          <p className="mt-1 text-xs text-gray-500">
            Estimated weighted amount: {parseInt(baseAmount) * trustScore} units (encrypted on-chain)
          </p>
        )}
      </div>

      {formError && (
        <p className="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400">
          {formError}
        </p>
      )}

      {txHash && (
        <div className="rounded-lg bg-emerald-900/30 px-3 py-2 text-xs text-emerald-400">
          <div className="flex items-center justify-between">
            <span>
              {isConfirmed ? 'Deposit confirmed' : isConfirming ? 'Confirming…' : 'Deposit submitted'}
            </span>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {txHash.slice(0, 12)}…
            </a>
          </div>
          {isConfirmed && (
            <p className="mt-1 text-emerald-500">
              Reward deposited. Operator balance updated.
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || isConfirming || trustScore === null}
        className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50"
      >
        {isLoading ? 'Processing…' : isConfirming ? 'Confirming…' : 'Weighted Deposit'}
      </button>
    </form>
  );
}
