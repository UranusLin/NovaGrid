# NovaGrid — Technical Architecture Document
# Version: 3.0 | Last Updated: 2026-03-26
# Target: AI coding assistants (Cursor, Claude Code, Copilot)

---

## [AI ASSISTANT CONTEXT]

This document describes the technical architecture of NovaGrid.
Read this AFTER reading PRD.md for product context.
When implementing, follow the patterns and code structures described here EXACTLY.

---

## 1. Technology Stack Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Module A)                   │
│  Next.js 14 (App Router) + React 18 + TypeScript        │
│  wagmi v2 + viem v2 (EVM wallet)                        │
│  fhenixjs v0.4.x (FHE client)                           │
│  Aleo SDK (ZK proof generation via Web Worker)           │
│  TailwindCSS v3.4 (styling)                             │
├─────────────────────────────────────────────────────────┤
│                    BACKEND (Module B)                    │
│  Node.js + Express + TypeScript                          │
│  @0glabs/0g-ts-sdk v0.3.x (DA storage)                  │
│  iotex-antenna v0.31.x (device identity)                 │
│  ethers v6 (blockchain interactions)                     │
│  zod (input validation)                                  │
├─────────────────────────────────────────────────────────┤
│                   SMART CONTRACTS                        │
│  Fhenix (Module C): Solidity + FHE.sol + Hardhat         │
│  Aleo (Module D): Leo language + snarkOS                 │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Module A: Frontend Architecture

### 2.1 Web3 Provider Setup

The frontend must support multiple chains simultaneously (Fhenix for FHE, IoTeX for device management). Use wagmi v2 multi-chain configuration.

```typescript
// src/components/providers/Web3Provider.tsx

import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';

// Define Fhenix Helium testnet chain
const fhenixHelium = {
  id: 8008135,
  name: 'Fhenix Helium',
  nativeCurrency: { name: 'tFHE', symbol: 'tFHE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.helium.fhenix.zone'] },
  },
  blockExplorers: {
    default: { name: 'Fhenix Explorer', url: 'https://explorer.helium.fhenix.zone' },
  },
} as const;

const config = createConfig({
  chains: [fhenixHelium],
  connectors: [injected()],
  transports: {
    [fhenixHelium.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 2.2 Fhenix Client Singleton

```typescript
// src/lib/fhenix.ts

import { FhenixClient, EncryptionTypes, getPermit } from 'fhenixjs';
import type { BrowserProvider } from 'ethers';

let fhenixClient: FhenixClient | null = null;

export async function getFhenixClient(provider: BrowserProvider): Promise<FhenixClient> {
  if (!fhenixClient) {
    fhenixClient = new FhenixClient({ provider });
  }
  return fhenixClient;
}

// Encrypt a uint32 value for contract input
export async function encryptUint32(client: FhenixClient, value: number) {
  return client.encrypt(value, EncryptionTypes.uint32);
}

// Generate a permit for reading encrypted state
export async function generatePermit(
  client: FhenixClient,
  contractAddress: string,
  provider: BrowserProvider
) {
  const permit = await getPermit(contractAddress, provider);
  client.storePermit(permit);
  return permit;
}
```

### 2.3 Aleo Web Worker Pattern

```typescript
// src/workers/aleo.worker.ts
// This runs in a separate thread to avoid blocking the UI

import { Account, ProgramManager } from '@demox-labs/aleo-sdk';

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'GENERATE_COMPLIANCE_PROOF': {
      const { lat, lng, regionBounds, privateKey } = payload;

      try {
        self.postMessage({ type: 'PROOF_STATUS', status: 'generating' });

        const account = new Account({ privateKey });
        const programManager = new ProgramManager();

        // Scale GPS coordinates to integers (6 decimal places)
        const scaledLat = Math.round(lat * 1_000_000);
        const scaledLng = Math.round(lng * 1_000_000);

        const inputs = [
          `{ lat: ${scaledLat}u64, lng: ${scaledLng}u64 }`,           // private DeviceLocation
          `{ min_lat: ${regionBounds.minLat}u64, max_lat: ${regionBounds.maxLat}u64, min_lng: ${regionBounds.minLng}u64, max_lng: ${regionBounds.maxLng}u64 }`, // public RegionBounds
          `${payload.deviceId}field`,                                   // private device_id
        ];

        const result = await programManager.executeOffline(
          'compliance.aleo',
          'verify_compliance',
          inputs,
          false, // not a fee estimation
          undefined,
          undefined,
          account
        );

        self.postMessage({
          type: 'PROOF_RESULT',
          proof: result,
          compliant: true, // parse from result
        });
      } catch (error) {
        self.postMessage({
          type: 'PROOF_ERROR',
          error: (error as Error).message,
        });
      }
      break;
    }
  }
};
```

```typescript
// src/hooks/useAleoWorker.ts

import { useCallback, useEffect, useRef, useState } from 'react';

type ProofState = {
  status: 'idle' | 'generating' | 'success' | 'error';
  proof: unknown | null;
  compliant: boolean | null;
  error: string | null;
};

export function useAleoWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<ProofState>({
    status: 'idle',
    proof: null,
    compliant: null,
    error: null,
  });

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/aleo.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (event) => {
      const { type, ...data } = event.data;
      switch (type) {
        case 'PROOF_STATUS':
          setState(prev => ({ ...prev, status: data.status }));
          break;
        case 'PROOF_RESULT':
          setState({ status: 'success', proof: data.proof, compliant: data.compliant, error: null });
          break;
        case 'PROOF_ERROR':
          setState({ status: 'error', proof: null, compliant: null, error: data.error });
          break;
      }
    };

    return () => workerRef.current?.terminate();
  }, []);

  const generateProof = useCallback((params: {
    lat: number;
    lng: number;
    regionBounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
    privateKey: string;
    deviceId: string;
  }) => {
    setState({ status: 'generating', proof: null, compliant: null, error: null });
    workerRef.current?.postMessage({ type: 'GENERATE_COMPLIANCE_PROOF', payload: params });
  }, []);

  return { ...state, generateProof };
}
```

### 2.4 Fhenix Hooks

```typescript
// src/hooks/useFhenixPermit.ts

import { useState, useCallback } from 'react';
import { useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import { getFhenixClient, generatePermit } from '@/lib/fhenix';

export function useFhenixPermit(contractAddress: string) {
  const { data: walletClient } = useWalletClient();
  const [permit, setPermit] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const requestPermit = useCallback(async () => {
    if (!walletClient) throw new Error('Wallet not connected');
    setLoading(true);

    try {
      // Convert wagmi walletClient to ethers BrowserProvider
      const provider = new BrowserProvider(walletClient.transport);
      const client = await getFhenixClient(provider);
      const newPermit = await generatePermit(client, contractAddress, provider);
      setPermit(newPermit);
      return newPermit;
    } finally {
      setLoading(false);
    }
  }, [walletClient, contractAddress]);

  return { permit, requestPermit, loading };
}
```

---

## 3. Module B: Relayer Architecture

### 3.1 Server Setup

```typescript
// src/index.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { telemetryRouter } from './routes/telemetry';
import { healthRouter } from './routes/health';
import { logger } from './lib/logger';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/telemetry', telemetryRouter);
app.use('/api/health', healthRouter);

app.listen(PORT, () => {
  logger.info(`NovaGrid Relayer running on port ${PORT}`);
});
```

### 3.2 0G DA Storage Service

```typescript
// src/services/zgStorage.ts

import { ZgFile, Indexer, getFlowContract } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';

export class ZgStorageService {
  private indexer: Indexer;
  private signer: ethers.Wallet;
  private flowContract: ReturnType<typeof getFlowContract>;

  constructor() {
    const provider = new ethers.JsonRpcProvider(process.env.ZG_RPC_URL);
    this.signer = new ethers.Wallet(process.env.ZG_PRIVATE_KEY!, provider);
    this.indexer = new Indexer(process.env.ZG_INDEXER_URL!);
    this.flowContract = getFlowContract(process.env.ZG_DA_CONTRACT!, this.signer);
  }

  async uploadTelemetry(data: object): Promise<{ txHash: string; rootHash: string }> {
    const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const zgFile = new ZgFile([jsonBlob]);

    const [tree, treeErr] = await zgFile.merkleTree();
    if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

    const rootHash = tree!.rootHash();

    const [tx, txErr] = await this.indexer.upload(
      zgFile,
      0, // segment index
      this.flowContract,
      this.signer
    );
    if (txErr) throw new Error(`Upload error: ${txErr}`);

    await zgFile.close();

    return {
      txHash: tx!,
      rootHash,
    };
  }

  async downloadTelemetry(rootHash: string): Promise<object> {
    const [data, err] = await this.indexer.download(rootHash, '.');
    if (err) throw new Error(`Download error: ${err}`);
    return JSON.parse(data!.toString());
  }
}
```

### 3.3 IoTeX ioID Verification Service

```typescript
// src/services/ioIdVerifier.ts

import Antenna from 'iotex-antenna';

export class IoIdVerifier {
  private antenna: Antenna;

  constructor() {
    this.antenna = new Antenna(process.env.IOTEX_RPC_URL!);
  }

  async verifyDevice(deviceId: string, signature: string, payload: string): Promise<boolean> {
    try {
      // 1. Query ioID registry for device DID document
      const didDocument = await this.queryIoIdRegistry(deviceId);
      if (!didDocument) return false;

      // 2. Extract device public key from DID document
      const devicePubKey = didDocument.publicKey;

      // 3. Verify signature against payload
      const isValid = this.verifySignature(payload, signature, devicePubKey);

      return isValid;
    } catch (error) {
      console.error('ioID verification failed:', error);
      return false;
    }
  }

  private async queryIoIdRegistry(deviceId: string) {
    // Read from ioID registry contract on IoTeX chain
    const result = await this.antenna.iotx.readContractByMethod({
      from: process.env.IOTEX_OPERATOR_ADDRESS!,
      contractAddress: process.env.IOID_REGISTRY_ADDRESS!,
      abi: IOID_REGISTRY_ABI,
      method: 'getDeviceDocument',
      args: [deviceId],
    });
    return result ? JSON.parse(result) : null;
  }

  private verifySignature(payload: string, signature: string, publicKey: string): boolean {
    // ECDSA signature verification
    const recoveredAddress = ethers.verifyMessage(payload, signature);
    return recoveredAddress.toLowerCase() === publicKey.toLowerCase();
  }
}
```

### 3.4 Telemetry Data Types

```typescript
// src/types/telemetry.ts

import { z } from 'zod';

export const TelemetryPayloadSchema = z.object({
  timestamp: z.number().int().positive(),
  metrics: z.object({
    temperature: z.number().optional(),
    hashrate: z.number().optional(),
    uptime: z.number().min(0).max(100),
    power_consumption: z.number().optional(),
    // GPS coordinates — these are NEVER stored on-chain
    // They are only used for ZK compliance proof generation
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  }),
  firmware_version: z.string().optional(),
  device_type: z.string(),
});

export type TelemetryPayload = z.infer<typeof TelemetryPayloadSchema>;

export const DeviceHeaders = z.object({
  'x-device-id': z.string().min(1),
  'x-device-signature': z.string().min(1),
  'x-device-timestamp': z.string().optional(),
});

export interface DAReceipt {
  txHash: string;
  rootHash: string;
  timestamp: number;
  deviceId: string;
}
```

---

## 4. Module C: Fhenix Contract Architecture

### 4.1 NovaVault.sol — Full Reference

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhenixprotocol/contracts/FHE.sol";
import "@fhenixprotocol/contracts/access/Permissioned.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NovaVault is Permissioned, Ownable {
    // === State ===
    mapping(address => euint32) private _encryptedBalances;
    mapping(address => euint32) private _encryptedTotalEarned;
    mapping(address => bool) public registeredOperators;

    address public rewardDistributor;
    uint256 public totalOperators;

    // === Events (no amounts — privacy!) ===
    event OperatorRegistered(address indexed operator);
    event RewardDeposited(address indexed operator, uint256 timestamp);
    event RewardClaimed(address indexed operator, uint256 timestamp);
    event DistributorUpdated(address indexed newDistributor);

    // === Modifiers ===
    modifier onlyDistributor() {
        require(msg.sender == rewardDistributor, "NovaVault: not distributor");
        _;
    }

    modifier onlyRegistered() {
        require(registeredOperators[msg.sender], "NovaVault: not registered");
        _;
    }

    constructor() Ownable(msg.sender) {
        // Initialize
    }

    // === Admin Functions ===

    function setDistributor(address _distributor) external onlyOwner {
        rewardDistributor = _distributor;
        emit DistributorUpdated(_distributor);
    }

    function registerOperator(address operator) external onlyOwner {
        require(!registeredOperators[operator], "NovaVault: already registered");
        registeredOperators[operator] = true;
        _encryptedBalances[operator] = FHE.asEuint32(0);
        _encryptedTotalEarned[operator] = FHE.asEuint32(0);
        totalOperators++;
        emit OperatorRegistered(operator);
    }

    // === Core Functions ===

    /// @notice Deposit encrypted reward for an operator (called by distributor)
    function depositReward(
        address operator,
        inEuint32 calldata encryptedAmount
    ) external onlyDistributor {
        require(registeredOperators[operator], "NovaVault: operator not registered");

        euint32 amount = FHE.asEuint32(encryptedAmount);
        _encryptedBalances[operator] = FHE.add(_encryptedBalances[operator], amount);
        _encryptedTotalEarned[operator] = FHE.add(_encryptedTotalEarned[operator], amount);

        emit RewardDeposited(operator, block.timestamp);
    }

    /// @notice Claim reward — operator withdraws from their encrypted balance
    function claimReward(inEuint32 calldata encryptedClaimAmount) external onlyRegistered {
        euint32 claimAmount = FHE.asEuint32(encryptedClaimAmount);

        // Verify sufficient balance (FHE comparison)
        ebool hasSufficientBalance = FHE.gte(_encryptedBalances[msg.sender], claimAmount);
        FHE.req(hasSufficientBalance);

        // Subtract from encrypted balance
        _encryptedBalances[msg.sender] = FHE.sub(_encryptedBalances[msg.sender], claimAmount);

        emit RewardClaimed(msg.sender, block.timestamp);
    }

    // === View Functions (Permit-gated) ===

    /// @notice Get encrypted balance — only readable by the operator via Permit
    function getEncryptedBalance(
        Permission calldata perm
    ) external view onlySender(perm) returns (string memory) {
        return FHE.sealoutput(_encryptedBalances[msg.sender], perm.publicKey);
    }

    /// @notice Get encrypted total earned — only readable by the operator via Permit
    function getEncryptedTotalEarned(
        Permission calldata perm
    ) external view onlySender(perm) returns (string memory) {
        return FHE.sealoutput(_encryptedTotalEarned[msg.sender], perm.publicKey);
    }
}
```

### 4.2 Hardhat Configuration

```typescript
// hardhat.config.ts

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "fhenix-hardhat-plugin";
import "fhenix-hardhat-docker";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    fhenixHelium: {
      url: "https://api.helium.fhenix.zone",
      chainId: 8008135,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
    localfhenix: {
      url: "http://localhost:42069",
      chainId: 412346,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
```

---

## 5. Module D: Aleo Program Architecture

### 5.1 Program Structure

```
aleo-compliance/
├── program.json          # Project metadata
├── src/
│   └── main.leo          # Main program source
├── inputs/
│   ├── verify_simple.in  # Test input: simple region check
│   └── verify_merkle.in  # Test input: Merkle proof check
└── build/                # Compiled artifacts (gitignored)
```

### 5.2 program.json

```json
{
  "program": "compliance.aleo",
  "version": "0.1.0",
  "description": "ZK compliance verification for DePIN device locations",
  "license": "MIT"
}
```

### 5.3 Test Inputs

```
// inputs/verify_simple.in
// Test case: Device in Taipei (25.0330°N, 121.5654°E)
// Region: Taiwan bounding box

[verify_compliance]
device: DeviceLocation = DeviceLocation {
    lat: 25033000u64,
    lng: 121565400u64
};
region: RegionBounds = RegionBounds {
    min_lat: 21900000u64,
    max_lat: 25300000u64,
    min_lng: 120000000u64,
    max_lng: 122000000u64
};
device_id: field = 12345field;
```

### 5.4 Build & Test Commands

```bash
# Install Leo CLI (if not installed)
cargo install leo-lang

# Navigate to project
cd contracts/aleo-compliance

# Build the program
leo build

# Run with test inputs
leo run verify_compliance

# Clean build artifacts
leo clean
```

---

## 6. Shared Configuration

### 6.1 Root package.json (npm workspaces)

```json
{
  "name": "novagrid-monorepo",
  "private": true,
  "workspaces": [
    "apps/web-dashboard",
    "apps/hardware-relayer",
    "contracts/fhenix-settlement"
  ],
  "scripts": {
    "dev:web": "npm -w apps/web-dashboard run dev",
    "dev:relayer": "npm -w apps/hardware-relayer run dev",
    "build:web": "npm -w apps/web-dashboard run build",
    "build:relayer": "npm -w apps/hardware-relayer run build",
    "test:contracts": "npm -w contracts/fhenix-settlement run test",
    "test:relayer": "npm -w apps/hardware-relayer run test",
    "deploy:fhenix": "npm -w contracts/fhenix-settlement run deploy",
    "lint": "npm run lint --workspaces"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 6.2 Shared tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

---

## 7. Error Handling Patterns

### 7.1 Frontend Error Boundaries

```typescript
// All blockchain interactions must be wrapped in try-catch with user-friendly messages

const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue.',
  FHE_ENCRYPT_FAILED: 'Encryption failed. Please try again.',
  PERMIT_DENIED: 'Permission denied. You can only view your own balance.',
  ZK_PROOF_TIMEOUT: 'Proof generation timed out. Please try again with a stable connection.',
  ZK_PROOF_FAILED: 'Proof generation failed. Please verify your input data.',
  DEVICE_NOT_REGISTERED: 'This device is not registered in the ioID registry.',
  DA_UPLOAD_FAILED: 'Failed to store data. The 0G network may be temporarily unavailable.',
  INSUFFICIENT_BALANCE: 'Insufficient encrypted balance for this claim amount.',
} as const;
```

### 7.2 Relayer Error Handling

```typescript
// All API errors return structured JSON
interface ApiError {
  error: string;
  code: string;
  timestamp: number;
  requestId?: string;
}

// HTTP status codes:
// 400 — Invalid payload (schema validation failed)
// 401 — Device authentication failed (invalid ioID or signature)
// 429 — Rate limit exceeded
// 500 — Internal error (0G upload failed, etc.)
// 503 — Service unavailable (downstream dependency down)
```
