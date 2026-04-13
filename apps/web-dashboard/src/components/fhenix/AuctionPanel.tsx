'use client';

import { useState } from 'react';
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
  SEALED_BID_AUCTION_ABI,
  SEALED_BID_AUCTION_ADDRESS,
} from '@/lib/contracts';
import { humanizeFheError } from '@/lib/fheErrors';

export function AuctionPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const navigateToCreatePermit = useCofheNavigateToCreatePermit();

  const [bidAmount, setBidAmount] = useState('');
  const [bidTxHash, setBidTxHash] = useState<`0x${string}` | null>(null);
  const [endEarlyTxHash, setEndEarlyTxHash] = useState<`0x${string}` | null>(null);
  const [finalizeTxHash, setFinalizeTxHash] = useState<`0x${string}` | null>(null);
  const [winTxHash, setWinTxHash] = useState<`0x${string}` | null>(null);
  const [bidError, setBidError] = useState<string | null>(null);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [winError, setWinError] = useState<string | null>(null);

  const { encryptAndWrite, encryption, write: encWrite } = useCofheEncryptAndWriteContract();
  const { writeContract, isPending: isWritePending } = useWriteContract();

  const { isLoading: isBidConfirming, isSuccess: isBidConfirmed } =
    useWaitForTransactionReceipt({ hash: bidTxHash ?? undefined });
  const { isLoading: isEndEarlyConfirming, isSuccess: isEndEarlyConfirmed } =
    useWaitForTransactionReceipt({ hash: endEarlyTxHash ?? undefined });
  const { isLoading: isFinalizeConfirming, isSuccess: isFinalizeConfirmed } =
    useWaitForTransactionReceipt({ hash: finalizeTxHash ?? undefined });
  const { isLoading: isWinConfirming, isSuccess: isWinConfirmed } =
    useWaitForTransactionReceipt({ hash: winTxHash ?? undefined });

  const isWrongNetwork = isConnected && chainId !== sepolia.id;
  const isEncrypting = encryption.isPending || encWrite.isPending;

  // ── Contract reads ──────────────────────────────────────────────────────────

  const { data: isActive, refetch: refetchActive } = useReadContract({
    address: SEALED_BID_AUCTION_ADDRESS,
    abi: SEALED_BID_AUCTION_ABI,
    functionName: 'isActive',
    chainId: sepolia.id,
  });

  const { data: finalized, refetch: refetchFinalized } = useReadContract({
    address: SEALED_BID_AUCTION_ADDRESS,
    abi: SEALED_BID_AUCTION_ABI,
    functionName: 'finalized',
    chainId: sepolia.id,
  });

  const { data: auctionEnd } = useReadContract({
    address: SEALED_BID_AUCTION_ADDRESS,
    abi: SEALED_BID_AUCTION_ABI,
    functionName: 'auctionEnd',
    chainId: sepolia.id,
  });

  const { data: availableSlots } = useReadContract({
    address: SEALED_BID_AUCTION_ADDRESS,
    abi: SEALED_BID_AUCTION_ABI,
    functionName: 'availableSlots',
    chainId: sepolia.id,
  });

  const { data: totalBidders } = useReadContract({
    address: SEALED_BID_AUCTION_ADDRESS,
    abi: SEALED_BID_AUCTION_ABI,
    functionName: 'bidderCount',
    chainId: sepolia.id,
  });

  const { data: userHasBid } = useReadContract({
    address: SEALED_BID_AUCTION_ADDRESS,
    abi: SEALED_BID_AUCTION_ABI,
    functionName: 'hasBid',
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: { enabled: isConnected && !!address },
  });

  const { data: userHasWinStatus } = useReadContract({
    address: SEALED_BID_AUCTION_ADDRESS,
    abi: SEALED_BID_AUCTION_ABI,
    functionName: 'hasWinStatus',
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: { enabled: isConnected && !!address },
  });

  const { data: contractOwner } = useReadContract({
    address: SEALED_BID_AUCTION_ADDRESS,
    abi: SEALED_BID_AUCTION_ABI,
    functionName: 'owner',
    chainId: sepolia.id,
  });

  const isOwner = address && contractOwner
    ? address.toLowerCase() === (contractOwner as string).toLowerCase()
    : false;

  // Encrypted win status — readable after checkWinStatus tx confirmed
  const {
    encrypted: encWin,
    decrypted: decWin,
    disabledDueToMissingPermit,
  } = useCofheReadContractAndDecrypt<
    typeof SEALED_BID_AUCTION_ABI,
    'getWinStatus',
    FheTypes.Uint32
  >(
    {
      address: SEALED_BID_AUCTION_ADDRESS,
      abi: SEALED_BID_AUCTION_ABI,
      functionName: 'getWinStatus',
      args: address ? [address] : undefined,
      requiresPermit: true,
    },
    {
      readQueryOptions: {
        enabled: isConnected && !!address && (userHasWinStatus === true || isWinConfirmed),
      },
    }
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleSubmitBid() {
    const amount = parseInt(bidAmount, 10);
    if (!address || isNaN(amount) || amount <= 0) return;
    setBidError(null);
    setBidTxHash(null);

    try {
      const hash = await encryptAndWrite({
        params: {
          address: SEALED_BID_AUCTION_ADDRESS,
          abi: SEALED_BID_AUCTION_ABI,
          functionName: 'submitBid',
          account: address,
          chain: sepolia,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: [Encryptable.uint32(BigInt(amount))] as any,
      });
      setBidTxHash(hash as `0x${string}`);
    } catch (err) {
      setBidError(humanizeFheError(err));
    }
  }

  function handleEndEarly() {
    if (!address) return;
    writeContract(
      {
        address: SEALED_BID_AUCTION_ADDRESS,
        abi: SEALED_BID_AUCTION_ABI,
        functionName: 'endEarly',
        chain: sepolia,
        account: address,
      },
      {
        onSuccess: (hash) => {
          setEndEarlyTxHash(hash);
          setTimeout(() => { refetchActive(); refetchFinalized(); }, 3000);
        },
        onError: (err) => setFinalizeError(humanizeFheError(err)),
      }
    );
  }

  function handleFinalize() {
    if (!address) return;
    setFinalizeError(null);
    setFinalizeTxHash(null);
    writeContract(
      {
        address: SEALED_BID_AUCTION_ADDRESS,
        abi: SEALED_BID_AUCTION_ABI,
        functionName: 'finalizeAuction',
        chain: sepolia,
        account: address,
      },
      {
        onSuccess: (hash) => {
          setFinalizeTxHash(hash);
          setTimeout(() => { refetchFinalized(); }, 3000);
        },
        onError: (err) => setFinalizeError(humanizeFheError(err)),
      }
    );
  }

  function handleCheckWin() {
    if (!address) return;
    setWinError(null);
    setWinTxHash(null);
    writeContract(
      {
        address: SEALED_BID_AUCTION_ADDRESS,
        abi: SEALED_BID_AUCTION_ABI,
        functionName: 'checkWinStatus',
        chain: sepolia,
        account: address,
      },
      {
        onSuccess: (hash) => setWinTxHash(hash),
        onError: (err) => setWinError(humanizeFheError(err)),
      }
    );
  }

  // ── Render: wrong network ──────────────────────────────────────────────────

  if (isWrongNetwork) {
    return (
      <div className="text-center">
        <p className="mb-3 text-sm text-yellow-400">Switch to Ethereum Sepolia to use the auction.</p>
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
        Connect MetaMask to participate in the auction.
      </p>
    );
  }

  // ── Render: main ──────────────────────────────────────────────────────────

  const endDate = auctionEnd ? new Date(Number(auctionEnd) * 1000) : null;
  const now = Date.now();
  const ended = endDate ? endDate.getTime() <= now : false;

  return (
    <div className="space-y-4">
      {/* Auction status bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Status</p>
          <p className="text-xs font-semibold mt-0.5">
            {finalized ? (
              <span className="text-purple-400">Finalized</span>
            ) : isActive ? (
              <span className="text-emerald-400">Open</span>
            ) : (
              <span className="text-yellow-400">Closed</span>
            )}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Bidders</p>
          <p className="text-xs font-semibold text-gray-300 mt-0.5">
            {totalBidders !== undefined ? String(totalBidders) : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Slots</p>
          <p className="text-xs font-semibold text-gray-300 mt-0.5">
            {availableSlots !== undefined ? String(availableSlots) : '—'}
          </p>
        </div>
      </div>

      {endDate && (
        <p className="text-center text-[11px] text-gray-600">
          {ended ? 'Auction ended' : 'Ends'}{' '}
          {endDate.toLocaleString()}
        </p>
      )}

      {/* Step 1: Submit bid */}
      {(isActive || (!finalized && !ended)) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Step 1 — Submit encrypted bid</span>
            {userHasBid && (
              <span className="rounded-full border border-blue-800 px-2 py-0.5 text-[10px] text-blue-400">
                Bid submitted
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600">
            Your bid amount is encrypted client-side. Other bidders only see a ciphertext. Submitting again overwrites your previous bid.
          </p>

          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              placeholder="Bid amount (e.g. 100)"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-blue-600 focus:outline-none"
            />
            <button
              onClick={handleSubmitBid}
              disabled={isEncrypting || isBidConfirming || !bidAmount || parseInt(bidAmount) <= 0}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
            >
              {isEncrypting ? 'Encrypting…' : isBidConfirming ? 'Confirming…' : 'Bid'}
            </button>
          </div>

          {bidError && (
            <p className="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400">{bidError}</p>
          )}
          {bidTxHash && (
            <div className="rounded-lg bg-blue-900/30 px-3 py-2 text-xs text-blue-400">
              {isBidConfirmed ? 'Bid submitted — only you know the amount.' : isBidConfirming ? 'Confirming…' : 'Submitted'}
              {' · '}
              <a href={`https://sepolia.etherscan.io/tx/${bidTxHash}`} target="_blank" rel="noreferrer" className="underline">
                {bidTxHash.slice(0, 10)}…
              </a>
            </div>
          )}
        </div>
      )}

      {/* Owner controls */}
      {isOwner && !finalized && (
        <div className="space-y-2 rounded-lg border border-orange-900/40 bg-orange-900/10 p-3">
          <p className="text-xs font-medium text-orange-400">Owner controls</p>
          <div className="flex gap-2">
            {isActive && (
              <button
                onClick={handleEndEarly}
                disabled={isWritePending || isEndEarlyConfirming}
                className="flex-1 rounded-lg border border-orange-700 bg-orange-900/20 px-3 py-2 text-xs font-medium text-orange-400 transition hover:bg-orange-900/40 disabled:opacity-50"
              >
                {isEndEarlyConfirming ? 'Ending…' : 'End Auction Early'}
              </button>
            )}
            {(ended || isEndEarlyConfirmed) && !finalized && (
              <button
                onClick={handleFinalize}
                disabled={isWritePending || isFinalizeConfirming}
                className="flex-1 rounded-lg bg-orange-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
              >
                {isFinalizeConfirming ? 'Finalizing…' : 'Finalize Auction'}
              </button>
            )}
          </div>
          {(endEarlyTxHash || finalizeTxHash) && (
            <div className="text-[10px] text-orange-400">
              {isFinalizeConfirmed
                ? 'Finalized — FHE.gt found encrypted maximum bid.'
                : isEndEarlyConfirmed
                ? 'Auction closed — click Finalize to compute max bid.'
                : 'Transaction submitted'}
            </div>
          )}
          {finalizeError && (
            <p className="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400">{finalizeError}</p>
          )}
        </div>
      )}

      {/* Step 2: Check win status */}
      {finalized && userHasBid && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Step 2 — Check win status</span>
            {(userHasWinStatus || isWinConfirmed) && (
              <span className="rounded-full border border-purple-800 px-2 py-0.5 text-[10px] text-purple-400">
                Status computed
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600">
            FHE.eq compares your encrypted bid against the encrypted maximum. Produces an
            encrypted result — 1 if you won, 0 if not. Only you can decrypt it.
          </p>

          {winError && (
            <p className="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400">{winError}</p>
          )}
          {winTxHash && (
            <div className="rounded-lg bg-purple-900/30 px-3 py-2 text-xs text-purple-400">
              {isWinConfirmed ? 'Win status computed — decrypt below.' : isWinConfirming ? 'Computing…' : 'Submitted'}
              {' · '}
              <a href={`https://sepolia.etherscan.io/tx/${winTxHash}`} target="_blank" rel="noreferrer" className="underline">
                {winTxHash.slice(0, 10)}…
              </a>
            </div>
          )}

          {!(userHasWinStatus || isWinConfirmed) && (
            <button
              onClick={handleCheckWin}
              disabled={isWritePending || isWinConfirming}
              className="w-full rounded-lg border border-purple-700 bg-purple-900/20 px-4 py-2.5 text-sm font-medium text-purple-300 transition hover:bg-purple-900/40 disabled:opacity-50"
            >
              {isWritePending ? 'Waiting for wallet…' : isWinConfirming ? 'Computing…' : 'Check Win Status'}
            </button>
          )}
        </div>
      )}

      {/* Step 3: Decrypt result */}
      {(userHasWinStatus || isWinConfirmed) && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-gray-400">Step 3 — Decrypt your result</span>

          <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-300">Auction result</p>
              {encWin.data && (
                <p className="mt-0.5 font-mono text-xs text-gray-600">
                  handle: 0x{(encWin.data as unknown as bigint).toString(16).slice(0, 10)}…
                </p>
              )}
            </div>
            <div className="text-right">
              {encWin.isLoading ? (
                <div className="h-5 w-20 animate-pulse rounded bg-gray-700" />
              ) : decWin.data !== undefined ? (
                decWin.data === BigInt(1) ? (
                  <div>
                    <span className="text-base font-semibold text-emerald-400">Winner</span>
                    <p className="text-xs text-gray-500">You won a slot!</p>
                  </div>
                ) : (
                  <div>
                    <span className="text-base font-semibold text-gray-500">Not selected</span>
                    <p className="text-xs text-gray-600">Your bid was not the highest</p>
                  </div>
                )
              ) : disabledDueToMissingPermit ? (
                <button
                  onClick={() => navigateToCreatePermit({ cause: 'clicked_on_confidential_balance' })}
                  className="rounded bg-yellow-900/30 px-2 py-1 text-xs text-yellow-400 transition hover:bg-yellow-900/50"
                >
                  Sign permit
                </button>
              ) : decWin.error ? (
                <button
                  onClick={() => navigateToCreatePermit({ cause: 'clicked_on_confidential_balance' })}
                  className="rounded bg-orange-900/30 px-2 py-1 text-xs text-orange-400 transition hover:bg-orange-900/50"
                >
                  Refresh permit
                </button>
              ) : !encWin.data ? (
                <span className="text-sm text-gray-500">Loading…</span>
              ) : (
                <span className="text-sm text-gray-400">Encrypted 🔒</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info when not finalized and auction ended */}
      {!finalized && ended && !isOwner && (
        <p className="text-center text-xs text-gray-600">
          Auction ended. Waiting for owner to finalize and compute the encrypted maximum bid.
        </p>
      )}
    </div>
  );
}
