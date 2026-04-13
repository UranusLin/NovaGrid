// Deployed contract addresses
export const NOVA_VAULT_ADDRESS =
  '0xF3bd6CA6bA7c2D413693322ab64868CB329F968f' as const;

export const REWARD_DISTRIBUTOR_ADDRESS =
  '0x27B1130bd453Da43E3b922B1AaB85f0a7252495F' as const;

// ABIs (minimal subsets used by the frontend)
export const NOVA_VAULT_ABI = [
  {
    name: 'getEncryptedBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'operator', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32', internalType: 'euint32' }],
  },
  {
    name: 'getEncryptedTotalEarned',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'operator', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32', internalType: 'euint32' }],
  },
  {
    name: 'claimReward',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'encryptedClaimAmount',
        type: 'tuple',
        internalType: 'struct InEuint32',
        components: [
          { name: 'ctHash', type: 'uint256' },
          { name: 'securityZone', type: 'uint8' },
          { name: 'utype', type: 'uint8' },
          { name: 'signature', type: 'bytes' },
        ],
      },
    ],
    outputs: [],
  },
  {
    name: 'distributor',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

export const REWARD_DISTRIBUTOR_ABI = [
  {
    name: 'distributeWeightedReward',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      {
        name: 'baseAmount',
        type: 'tuple',
        internalType: 'struct InEuint32',
        components: [
          { name: 'ctHash', type: 'uint256' },
          { name: 'securityZone', type: 'uint8' },
          { name: 'utype', type: 'uint8' },
          { name: 'signature', type: 'bytes' },
        ],
      },
      { name: 'trustScore', type: 'uint64' },
    ],
    outputs: [],
  },
  {
    name: 'vault',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'TRUST_SCORE_MIN',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint64' }],
  },
  {
    name: 'TRUST_SCORE_MAX',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint64' }],
  },
] as const;

// ── PrivacyLeaderboard ─────────────────────────────────────────────────────
// TODO: Update this address after running: npm run deploy:sepolia in contracts/fhenix-settlement
export const PRIVACY_LEADERBOARD_ADDRESS =
  '0xAd3710ba23753edd19d715F13254657137A367F4' as const;

const InEuint32Components = [
  { name: 'ctHash', type: 'uint256' },
  { name: 'securityZone', type: 'uint8' },
  { name: 'utype', type: 'uint8' },
  { name: 'signature', type: 'bytes' },
] as const;

export const PRIVACY_LEADERBOARD_ABI = [
  {
    name: 'submitScore',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'encryptedScore',
        type: 'tuple',
        internalType: 'struct InEuint32',
        components: InEuint32Components,
      },
    ],
    outputs: [],
  },
  {
    name: 'computeMyRank',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'getMyRank',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32', internalType: 'euint32' }],
  },
  {
    name: 'hasRank',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'isEnrolled',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'nodeCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// ── SealedBidAuction ──────────────────────────────────────────────────────
export const SEALED_BID_AUCTION_ADDRESS =
  '0xFc6d429BF9f505281E86FeE965dE94704DAF22F8' as const;

export const SEALED_BID_AUCTION_ABI = [
  {
    name: 'submitBid',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'encryptedBid',
        type: 'tuple',
        internalType: 'struct InEuint32',
        components: InEuint32Components,
      },
    ],
    outputs: [],
  },
  {
    name: 'endEarly',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'finalizeAuction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'checkWinStatus',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'getWinStatus',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'bidder', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32', internalType: 'euint32' }],
  },
  {
    name: 'getMyBid',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'bidder', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32', internalType: 'euint32' }],
  },
  {
    name: 'hasBid',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'bidder', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'hasWinStatus',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'bidder', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'bidderCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'isActive',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'finalized',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'auctionEnd',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'availableSlots',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getBidders',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'BidSubmitted',
    type: 'event',
    inputs: [
      { name: 'bidder', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'AuctionFinalized',
    type: 'event',
    inputs: [
      { name: 'bidderCount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'WinStatusChecked',
    type: 'event',
    inputs: [
      { name: 'bidder', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;
