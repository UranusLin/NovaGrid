'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { sepolia } from 'viem/chains';
import {
  useCofheEncryptAndWriteContract,
  useCofheReadContractAndDecrypt,
  useCofheNavigateToCreatePermit,
} from '@cofhe/react';
import { Encryptable, FheTypes } from '@cofhe/sdk';
import {
  PRIVACY_LEADERBOARD_ABI,
  PRIVACY_LEADERBOARD_ADDRESS,
} from '@/lib/contracts';
import { humanizeFheError } from '@/lib/fheErrors';

const IS_DEPLOYED =
  PRIVACY_LEADERBOARD_ADDRESS !== '0x0000000000000000000000000000000000000000';

export function LeaderboardPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const navigateToCreatePermit = useCofheNavigateToCreatePermit();

  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [submitTxHash, setSubmitTxHash] = useState<`0x${string}` | null>(null);
  const [rankTxHash, setRankTxHash] = useState<`0x${string}` | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rankError, setRankError] = useState<string | null>(null);

  const { encryptAndWrite, encryption, write: encWrite } = useCofheEncryptAndWriteContract();
  const { writeContract, isPending: isRankPending } = useWriteContract();

  const { isLoading: isSubmitConfirming, isSuccess: isSubmitConfirmed } =
    useWaitForTransactionReceipt({ hash: submitTxHash ?? undefined });
  const { isLoading: isRankConfirming, isSuccess: isRankConfirmed } =
    useWaitForTransactionReceipt({ hash: rankTxHash ?? undefined });

  const isWrongNetwork = isConnected && chainId !== sepolia.id;
  const isSubmitting = encryption.isPending || encWrite.isPending;

  // Read trust score from localStorage (written by ZK proof)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('novagrid:zkTrustScore');
      if (raw !== null) setTrustScore(Number(raw));
    } catch {
      // localStorage unavailable
    }
  }, []);

  // ── Contract reads ─────────────────────────────────────────────────────────

  const { data: totalNodes } = useReadContract({
    address: PRIVACY_LEADERBOARD_ADDRESS,
    abi: PRIVACY_LEADERBOARD_ABI,
    functionName: 'nodeCount',
    chainId: sepolia.id,
    query: { enabled: IS_DEPLOYED },
  });

  const { data: enrolled } = useReadContract({
    address: PRIVACY_LEADERBOARD_ADDRESS,
    abi: PRIVACY_LEADERBOARD_ABI,
    functionName: 'isEnrolled',
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: { enabled: IS_DEPLOYED && isConnected && !!address },
  });

  const { data: rankAvailable } = useReadContract({
    address: PRIVACY_LEADERBOARD_ADDRESS,
    abi: PRIVACY_LEADERBOARD_ABI,
    functionName: 'hasRank',
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: { enabled: IS_DEPLOYED && isConnected && !!address },
  });

  // Encrypted rank — readable only after computeMyRank tx confirmed
  const { encrypted: encRank, decrypted: decRank, disabledDueToMissingPermit } =
    useCofheReadContractAndDecrypt<
      typeof PRIVACY_LEADERBOARD_ABI,
      'getMyRank',
      FheTypes.Uint32
    >(
      {
        address: PRIVACY_LEADERBOARD_ADDRESS,
        abi: PRIVACY_LEADERBOARD_ABI,
        functionName: 'getMyRank',
        args: address ? [address] : undefined,
        requiresPermit: true,
      },
      {
        readQueryOptions: {
          enabled: IS_DEPLOYED && isConnected && !!address && (rankAvailable === true || isRankConfirmed),
        },
      }
    );

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleSubmitScore() {
    if (!address || trustScore === null) return;
    setSubmitError(null);
    setSubmitTxHash(null);

    try {
      const hash = await encryptAndWrite({
        params: {
          address: PRIVACY_LEADERBOARD_ADDRESS,
          abi: PRIVACY_LEADERBOARD_ABI,
          functionName: 'submitScore',
          account: address,
          chain: sepolia,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: [Encryptable.uint32(BigInt(trustScore))] as any,
      });
      setSubmitTxHash(hash as `0x${string}`);
    } catch (err) {
      setSubmitError(humanizeFheError(err));
    }
  }

  function handleComputeRank() {
    if (!address) return;
    setRankError(null);
    setRankTxHash(null);

    writeContract(
      {
        address: PRIVACY_LEADERBOARD_ADDRESS,
        abi: PRIVACY_LEADERBOARD_ABI,
        functionName: 'computeMyRank',
        chain: sepolia,
        account: address,
      },
      {
        onSuccess: (hash) => setRankTxHash(hash),
        onError: (err) => setRankError(humanizeFheError(err)),
      }
    );
  }

  // ── Render: not deployed ───────────────────────────────────────────────────

  if (!IS_DEPLOYED) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-4 text-center">
        <p className="text-sm text-gray-500">
          PrivacyLeaderboard contract not yet deployed.
        </p>
        <p className="mt-1 text-xs text-gray-600">
          Run{' '}
          <code className="rounded bg-gray-800 px-1 py-0.5 text-gray-400">
            npm run deploy:sepolia
          </code>{' '}
          in <code className="rounded bg-gray-800 px-1 py-0.5 text-gray-400">contracts/fhenix-settlement</code>,
          then update <code className="rounded bg-gray-800 px-1 py-0.5 text-gray-400">PRIVACY_LEADERBOARD_ADDRESS</code> in{' '}
          <code className="rounded bg-gray-800 px-1 py-0.5 text-gray-400">src/lib/contracts.ts</code>.
        </p>
      </div>
    );
  }

  // ── Render: wrong network ──────────────────────────────────────────────────

  if (isWrongNetwork) {
    return (
      <div className="text-center">
        <p className="mb-3 text-sm text-yellow-400">Switch to Ethereum Sepolia to use the leaderboard.</p>
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

  // ── Render: not connected ──────────────────────────────────────────────────

  if (!isConnected || !address) {
    return (
      <p className="text-center text-sm text-gray-500">
        Connect MetaMask to use the leaderboard.
      </p>
    );
  }

  // ── Render: main ──────────────────────────────────────────────────────────

  const nodeTotal = totalNodes !== undefined ? Number(totalNodes) : null;

  return (
    <div className="space-y-4">
      {/* Network stats */}
      <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
        <span className="text-xs text-gray-500">Nodes in network</span>
        <span className="font-semibold text-gray-300">
          {nodeTotal !== null ? nodeTotal : '—'}
        </span>
      </div>

      {/* Step 1: Submit encrypted score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">Step 1 — Submit encrypted score</span>
          {enrolled && (
            <span className="rounded-full border border-emerald-800 px-2 py-0.5 text-[10px] text-emerald-500">
              Enrolled
            </span>
          )}
        </div>

        {trustScore !== null ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">ZK Trust Score (encrypted)</span>
              <span className="font-semibold text-emerald-400">{trustScore}/100</span>
            </div>
            <p className="mt-0.5 text-xs text-gray-600">
              Score is encrypted client-side — other nodes see only a ciphertext
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-600">
            No ZK proof yet.{' '}
            <Link href="/compliance" className="underline text-gray-500 hover:text-gray-300">
              Generate one first →
            </Link>
          </p>
        )}

        {submitError && (
          <p className="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400">{submitError}</p>
        )}
        {submitTxHash && (
          <div className="rounded-lg bg-emerald-900/30 px-3 py-2 text-xs text-emerald-400">
            {isSubmitConfirmed
              ? 'Score submitted — you are enrolled in the leaderboard.'
              : isSubmitConfirming
              ? 'Confirming…'
              : 'Submitted'}
            {' · '}
            <a
              href={`https://sepolia.etherscan.io/tx/${submitTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {submitTxHash.slice(0, 10)}…
            </a>
          </div>
        )}

        <button
          onClick={handleSubmitScore}
          disabled={isSubmitting || isSubmitConfirming || trustScore === null}
          className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Encrypting…' : isSubmitConfirming ? 'Confirming…' : 'Submit Encrypted Score'}
        </button>
      </div>

      {/* Step 2: Compute rank */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-gray-400">Step 2 — Compute your private rank</span>
        <p className="text-xs text-gray-600">
          FHE.lt compares your encrypted score against every other node. The result is an
          encrypted count — only you can decrypt it.
        </p>

        {rankError && (
          <p className="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400">{rankError}</p>
        )}
        {rankTxHash && (
          <div className="rounded-lg bg-blue-900/30 px-3 py-2 text-xs text-blue-400">
            {isRankConfirmed
              ? 'Rank computed — decrypt below.'
              : isRankConfirming
              ? 'Computing rank on-chain…'
              : 'Transaction submitted'}
            {' · '}
            <a
              href={`https://sepolia.etherscan.io/tx/${rankTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {rankTxHash.slice(0, 10)}…
            </a>
          </div>
        )}

        <button
          onClick={handleComputeRank}
          disabled={!enrolled || isRankPending || isRankConfirming}
          className="w-full rounded-lg border border-blue-700 bg-blue-900/20 px-4 py-2.5 text-sm font-medium text-blue-300 transition hover:bg-blue-900/40 disabled:opacity-50"
        >
          {isRankPending ? 'Waiting for wallet…' : isRankConfirming ? 'Computing…' : 'Compute My Rank'}
        </button>
        {!enrolled && (
          <p className="text-center text-xs text-gray-600">Submit your score first to unlock rank computation</p>
        )}
      </div>

      {/* Step 3: Decrypt rank */}
      {(rankAvailable || isRankConfirmed) && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-gray-400">Step 3 — Decrypt your rank</span>

          <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-300">Nodes scoring below you</p>
              {encRank.data && (
                <p className="mt-0.5 font-mono text-xs text-gray-600">
                  handle: 0x{(encRank.data as unknown as bigint).toString(16).slice(0, 10)}…
                </p>
              )}
            </div>
            <div className="text-right">
              {encRank.isLoading ? (
                <div className="h-5 w-16 animate-pulse rounded bg-gray-700" />
              ) : decRank.data !== undefined ? (
                <div>
                  <span className="text-base font-semibold text-blue-400">
                    {String(decRank.data)}
                  </span>
                  {nodeTotal !== null && nodeTotal > 1 && (
                    <p className="text-xs text-gray-500">
                      of {nodeTotal - 1} others
                    </p>
                  )}
                </div>
              ) : disabledDueToMissingPermit ? (
                <button
                  onClick={() => navigateToCreatePermit({ cause: 'clicked_on_confidential_balance' })}
                  className="rounded bg-yellow-900/30 px-2 py-1 text-xs text-yellow-400 transition hover:bg-yellow-900/50"
                >
                  Sign permit
                </button>
              ) : decRank.error ? (
                <button
                  onClick={() => navigateToCreatePermit({ cause: 'clicked_on_confidential_balance' })}
                  className="rounded bg-orange-900/30 px-2 py-1 text-xs text-orange-400 transition hover:bg-orange-900/50"
                >
                  Refresh permit
                </button>
              ) : !encRank.data ? (
                <span className="text-sm text-gray-500">No rank yet</span>
              ) : (
                <span className="text-sm text-gray-400">Encrypted 🔒</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
