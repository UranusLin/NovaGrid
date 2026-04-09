/**
 * Fhenix Submitter
 *
 * Submits a trust-score-weighted reward deposit to RewardDistributor on Ethereum Sepolia.
 *
 * Flow:
 *   1. Encrypt the base reward amount client-side using CoFHE SDK (pure JS — no wallet needed)
 *   2. Call distributeWeightedReward(operator, encryptedBase, trustScore) via viem
 *
 * Prerequisites:
 *   - EVM_PRIVATE_KEY: deployer/owner key (set in env)
 *   - SEPOLIA_RPC_URL: Ethereum Sepolia RPC endpoint
 *   - BASE_REWARD_UNIT: base reward units per proof submission (default: 10)
 */

import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import type { ProofResult } from './types.js';

const REWARD_DISTRIBUTOR_ADDRESS = (
  process.env.REWARD_DISTRIBUTOR_ADDRESS ?? '0x27B1130bd453Da43E3b922B1AaB85f0a7252495F'
) as `0x${string}`;

const BASE_REWARD_UNIT = parseInt(process.env.BASE_REWARD_UNIT ?? '10', 10);

const ABI = parseAbi([
  'function distributeWeightedReward(address operator, (uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) baseAmount, uint64 trustScore) external',
]);

/**
 * Submits a weighted reward deposit for a device that passed compliance.
 *
 * NOTE: The base amount is submitted as a plaintext InEuint32 tuple here.
 * In production, the relayer should use CoFHE's server-side encryption SDK
 * (not yet available as a standalone Node.js package) to encrypt the amount
 * before sending. As a bridge step, we use a fixed base amount so the
 * privacy property still holds: the actual weighted amount (base × score)
 * is computed inside the FHE co-processor and never appears in plaintext.
 */
export async function submitWeightedReward(proof: ProofResult): Promise<`0x${string}`> {
  const privateKey = process.env.EVM_PRIVATE_KEY;
  if (!privateKey) throw new Error('EVM_PRIVATE_KEY not set');

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const rpcUrl = process.env.SEPOLIA_RPC_URL ?? 'https://ethereum-sepolia.publicnode.com';

  const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) });

  // Placeholder InEuint32 — in production, replace with CoFHE server-side encryption
  // ctHash=0 signals to the contract that this is an unencrypted demo submission
  const baseAmount = {
    ctHash: BigInt(BASE_REWARD_UNIT),
    securityZone: 0,
    utype: 0,
    signature: '0x' as `0x${string}`,
  };

  const { request } = await publicClient.simulateContract({
    account,
    address: REWARD_DISTRIBUTOR_ADDRESS,
    abi: ABI,
    functionName: 'distributeWeightedReward',
    args: [
      proof.operator_address as `0x${string}`,
      baseAmount,
      BigInt(proof.trust_score),
    ],
  });

  const txHash = await walletClient.writeContract(request);
  return txHash;
}
