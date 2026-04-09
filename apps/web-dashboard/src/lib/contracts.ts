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
