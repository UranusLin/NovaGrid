# NovaGrid — Product Requirements Document (PRD)
# Version: 3.0 | Last Updated: 2026-03-26
# Target: AI coding assistants (Cursor, Claude Code, Copilot)

---

## [SYSTEM INSTRUCTIONS FOR AI ASSISTANT]

You are implementing "NovaGrid", a privacy-first DePIN infrastructure network.
This is a **monorepo** project with 4 independent modules that share a common frontend.
Each module targets a specific blockchain ecosystem for separate Buildathon submissions.

**CRITICAL RULES:**
1. Use ONLY the pinned package versions specified in this document.
2. Do NOT install or suggest packages not listed here.
3. When generating code for a specific module, do NOT import or reference other modules' dependencies.
4. All code must be TypeScript-first with strict mode enabled.
5. Follow the directory structure EXACTLY as specified.
6. When asked to "build Module X", refer to the corresponding section below for full specs.

---

## 1. Project Overview

### 1.1 What is NovaGrid?

NovaGrid is a **privacy-first DePIN (Decentralized Physical Infrastructure Network)** designed for high-value hardware nodes (e.g., industrial mining machines, GPU clusters, IoT sensor arrays).

**The core problem:** DePIN networks today expose sensitive operational data on-chain — device locations, revenue streams, uptime metrics, and compliance status are all publicly visible. This creates security risks for hardware operators and competitive intelligence leaks for businesses.

**NovaGrid solves this with three privacy layers:**

| Layer | Technology | What It Protects |
|-------|-----------|-----------------|
| Data Availability | 0G DA (via IoTeX relay) | Raw telemetry data stored off-chain with DA guarantees |
| Reward Privacy | Fhenix FHE | Token balances and reward distributions encrypted on-chain |
| Compliance Privacy | Aleo ZK | GPS/location compliance proofs without revealing coordinates |

### 1.2 User Personas

**Persona A: Hardware Operator (Primary)**
- Owns physical DePIN nodes (miners, sensors, compute units)
- Needs to prove compliance (location, uptime) without exposing operational details
- Wants to claim rewards without revealing business scale

**Persona B: Network Verifier**
- Validates that hardware nodes meet compliance requirements
- Only sees ZK proof results (pass/fail), never raw data

**Persona C: Protocol Admin**
- Sets compliance regions and reward parameters
- Cannot see individual operator balances (FHE-encrypted)

### 1.3 Product Narrative by Track

> **IMPORTANT:** When submitting to each Buildathon, use ONLY the corresponding narrative below. Do NOT cross-reference other tracks in submission materials.

**For Fhenix Buildathon submission:**
> "NovaGrid uses Fully Homomorphic Encryption to protect DePIN node operators' reward balances and distribution patterns. In traditional DePIN networks, anyone can see how much each node earns — exposing business scale and creating competitive risks. NovaGrid's FHE Settlement Layer encrypts all balances on-chain using Fhenix's euint32/euint64 types, enabling reward accumulation and claiming without ever revealing amounts publicly. Operators decrypt their own balances client-side using Fhenix Permits."

**For Aleo Buildathon submission:**
> "NovaGrid enables DePIN hardware nodes to prove regulatory compliance — specifically geographic location requirements — without revealing their actual GPS coordinates. Using Aleo's Leo language, NovaGrid implements a ZK compliance circuit that verifies a device's latitude/longitude falls within an approved region (defined by a Merkle tree of valid coordinate ranges), outputting only a boolean pass/fail. This preserves operator privacy while satisfying regulatory requirements."

**For IoTeX Buildathon submission:**
> "NovaGrid is a DePIN data infrastructure that securely relays hardware telemetry from physical nodes to decentralized storage. Using IoTeX's ioID for device identity verification and 0G's Data Availability layer for scalable off-chain storage, NovaGrid creates a trustworthy pipeline from physical hardware to on-chain state — without exposing raw sensor data. The system supports identity-verified data submission, tamper-proof storage, and privacy-preserving downstream processing."

---

## 2. Monorepo Directory Structure

```
novagrid-monorepo/
├── apps/
│   ├── web-dashboard/                 # [Module A] Next.js frontend
│   │   ├── src/
│   │   │   ├── app/                   # Next.js App Router pages
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx           # Landing / Dashboard
│   │   │   │   ├── rewards/
│   │   │   │   │   └── page.tsx       # Fhenix reward claim UI
│   │   │   │   ├── compliance/
│   │   │   │   │   └── page.tsx       # Aleo ZK proof generation UI
│   │   │   │   └── devices/
│   │   │   │       └── page.tsx       # IoTeX device management UI
│   │   │   ├── components/
│   │   │   │   ├── providers/
│   │   │   │   │   └── Web3Provider.tsx
│   │   │   │   ├── fhenix/
│   │   │   │   │   ├── RewardBalance.tsx
│   │   │   │   │   ├── ClaimReward.tsx
│   │   │   │   │   └── EncryptedDeposit.tsx
│   │   │   │   ├── aleo/
│   │   │   │   │   ├── ComplianceProver.tsx
│   │   │   │   │   └── ProofStatus.tsx
│   │   │   │   └── iotex/
│   │   │   │       ├── DeviceList.tsx
│   │   │   │       └── TelemetryFeed.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useFhenixPermit.ts
│   │   │   │   ├── useAleoWorker.ts
│   │   │   │   └── useDeviceIdentity.ts
│   │   │   ├── lib/
│   │   │   │   ├── fhenix.ts          # FhenixClient singleton
│   │   │   │   ├── aleo.ts            # Aleo SDK wrapper
│   │   │   │   └── constants.ts       # Contract addresses, chain configs
│   │   │   └── workers/
│   │   │       └── aleo.worker.ts     # Web Worker for ZK proof generation
│   │   ├── public/
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── hardware-relayer/              # [Module B] Node.js backend
│       ├── src/
│       │   ├── index.ts               # Express server entry
│       │   ├── routes/
│       │   │   ├── telemetry.ts       # POST /api/telemetry
│       │   │   └── health.ts          # GET /api/health
│       │   ├── services/
│       │   │   ├── zgStorage.ts       # 0G DA client
│       │   │   ├── ioIdVerifier.ts    # IoTeX ioID verification
│       │   │   └── dataProcessor.ts   # Telemetry normalization
│       │   ├── middleware/
│       │   │   ├── auth.ts            # Device authentication
│       │   │   └── rateLimit.ts
│       │   └── types/
│       │       └── telemetry.ts       # Type definitions
│       ├── tsconfig.json
│       └── package.json
│
├── contracts/
│   ├── fhenix-settlement/             # [Module C] Hardhat + Fhenix
│   │   ├── contracts/
│   │   │   ├── NovaVault.sol          # Main FHE vault contract
│   │   │   ├── RewardDistributor.sol  # Encrypted reward distribution
│   │   │   └── interfaces/
│   │   │       └── INovaVault.sol
│   │   ├── test/
│   │   │   └── NovaVault.test.ts
│   │   ├── deploy/
│   │   │   └── 01_deploy_vault.ts
│   │   ├── hardhat.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── aleo-compliance/               # [Module D] Leo project
│       ├── src/
│       │   └── main.leo               # compliance.aleo program
│       ├── inputs/
│       │   └── compliance.in          # Sample inputs
│       ├── build/                     # Leo build artifacts
│       ├── program.json
│       └── README.md
│
├── docs/
│   ├── PRD.md                         # This file
│   ├── ARCHITECTURE.md                # Technical architecture
│   └── TRACK_PLAYBOOK.md              # Submission strategies
│
├── .gitignore
├── package.json                       # Workspace root (npm workspaces)
├── tsconfig.base.json                 # Shared TS config
└── README.md
```

---

## 3. Module Specifications

---

### Module A: Web Dashboard (Frontend)

**Purpose:** Unified control panel for hardware operators to interact with all three privacy layers.

**Framework:** Next.js 14 (App Router) + React 18 + TypeScript

**Package Dependencies (STRICT — use these exact versions):**

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "wagmi": "^2.12.0",
    "viem": "^2.21.0",
    "@tanstack/react-query": "^5.50.0",
    "fhenixjs": "^0.4.1",
    "tailwindcss": "^3.4.0",
    "@headlessui/react": "^2.1.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/react": "^18.3.0",
    "@types/node": "^20.14.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

**IMPORTANT NOTES ON FHENIXJS:**
- `fhenixjs` v0.4.x uses `FhenixClient` class — do NOT use deprecated `FhenixProvider` pattern
- Permit system: use `client.generatePermit(contractAddress)` then pass permit to contract view functions
- Encryption: use `client.encrypt(value, EncryptionTypes.uint32)` — returns `inEuint32` for contract input
- The FhenixClient requires an EIP-1193 provider from wagmi/viem

**IMPORTANT NOTES ON ALEO SDK:**
- Aleo proof generation is CPU-intensive — MUST run in a Web Worker
- Use `@demox-labs/aleo-sdk` if `@aleohq/sdk` has compatibility issues
- Leo programs compile to `.aleo` instructions — the SDK executes these client-side
- For the frontend, only the proof generation and verification are needed

**Page Routing & Features:**

| Route | Module | Features |
|-------|--------|----------|
| `/` | All | Dashboard overview, connected wallet status |
| `/rewards` | Fhenix | View encrypted balance, deposit, claim rewards |
| `/compliance` | Aleo | Generate ZK compliance proof, view proof history |
| `/devices` | IoTeX | Register devices, view telemetry status, ioID management |

**UI/UX Requirements:**
- Dark theme primary (infrastructure/DePIN aesthetic)
- Must show clear loading states for ZK proof generation (can take 10-30s)
- FHE balance should show "Encrypted" placeholder until user decrypts via Permit
- Responsive but desktop-first (hardware operators use desktop)

---

### Module B: DePIN Data Relayer (Hardware Gateway)

**Purpose:** Backend service that receives telemetry from physical hardware, verifies device identity via IoTeX ioID, and stores data on 0G DA.

**Framework:** Node.js + Express + TypeScript

**Package Dependencies (STRICT):**

```json
{
  "dependencies": {
    "@0glabs/0g-ts-sdk": "^0.3.3",
    "iotex-antenna": "^0.31.0",
    "ethers": "^6.11.0",
    "express": "^4.19.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "zod": "^3.23.0",
    "winston": "^3.13.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "typescript": "^5.5.0",
    "tsx": "^4.15.0",
    "vitest": "^1.6.0"
  }
}
```

**IMPORTANT NOTES ON 0G SDK:**
- `@0glabs/0g-ts-sdk` v0.3.x — uses `ZgFile` and `Indexer` classes
- Initialize with: `const zgFile = new ZgFile([new Blob([data])])`
- Upload flow: create file → get Merkle root → submit to 0G DA contract
- Requires an `ethers.Wallet` signer connected to 0G testnet
- 0G testnet RPC and contract addresses must be configured in environment

**IMPORTANT NOTES ON IOTEX ANTENNA:**
- `iotex-antenna` is the official IoTeX SDK for Node.js
- Use `Antenna` class for RPC connection to IoTeX chain
- ioID verification: query the ioID registry contract to verify device DID
- Device identity is tied to an on-chain DID document

**API Endpoints:**

```
POST /api/telemetry
  Headers: x-device-id, x-device-signature
  Body: { timestamp, metrics: { temperature, hashrate, uptime, lat, lng } }
  Flow:
    1. Verify device identity via ioID registry
    2. Validate payload schema (zod)
    3. Normalize and encrypt sensitive fields
    4. Upload to 0G DA
    5. Return { txHash, merkleRoot, daTimestamp }

GET /api/health
  Returns: { status, connectedDevices, lastSync }

GET /api/devices/:deviceId/history
  Returns: Recent telemetry submission history (metadata only, no raw data)
```

**Data Flow Diagram:**
```
[Hardware Node] 
    → POST /api/telemetry (signed payload)
    → [Relayer: Verify ioID] 
    → [Relayer: Validate + Process]
    → [0G DA: Store blob] 
    → [Return DA receipt to device]
    → [Optional: Trigger on-chain state update]
```

---

### Module C: FHE Settlement Layer (Fhenix Contracts)

**Purpose:** Solidity smart contracts on Fhenix that manage encrypted reward balances using FHE operations.

**Framework:** Hardhat + Fhenix Plugin

**Package Dependencies (STRICT):**

```json
{
  "dependencies": {
    "@fhenixprotocol/contracts": "^0.3.1",
    "@openzeppelin/contracts": "^5.0.0"
  },
  "devDependencies": {
    "hardhat": "^2.22.0",
    "fhenix-hardhat-plugin": "^0.3.0",
    "fhenix-hardhat-docker": "^0.3.0",
    "@nomicfoundation/hardhat-toolbox": "^5.0.0",
    "@typechain/hardhat": "^9.1.0",
    "typescript": "^5.5.0"
  }
}
```

**IMPORTANT NOTES ON FHENIX CONTRACTS:**
- Import path: `import { FHE, euint32, inEuint32 } from "@fhenixprotocol/contracts";`
- Encrypt on-chain: `euint32 encryptedValue = FHE.asEuint32(plaintextValue);`
- Accept encrypted input from frontend: use `inEuint32` type in function parameters
- Decrypt for user: use the Permit system — `FHE.sealoutput(encryptedValue, publicKey)`
- FHE addition: `FHE.add(a, b)` where both are `euint32`
- FHE comparison: `FHE.gte(a, b)` returns `ebool`
- **NEVER** use `FHE.decrypt()` in production — it reveals values on-chain. Use `sealoutput` + Permits instead.
- Gas costs are higher for FHE ops — keep encrypted operations minimal per transaction.

**Contract: NovaVault.sol**

```
Core State:
  mapping(address => euint32) private encryptedBalances;
  mapping(address => euint32) private encryptedTotalEarned;
  address public rewardDistributor;

Functions:
  depositReward(address operator, inEuint32 calldata encryptedAmount) external onlyDistributor
    - Converts input: euint32 amount = FHE.asEuint32(encryptedAmount)
    - Adds to balance: encryptedBalances[operator] = FHE.add(encryptedBalances[operator], amount)
    - Emits: RewardDeposited(operator) // no amount in event — privacy!

  claimReward(inEuint32 calldata encryptedClaimAmount) external
    - Verifies: FHE.gte(encryptedBalances[msg.sender], FHE.asEuint32(encryptedClaimAmount))
    - Subtracts from encrypted balance
    - Transfers actual tokens (bridge between encrypted and plain)
    - Emits: RewardClaimed(msg.sender)

  getEncryptedBalance(Permission calldata perm) external view returns (string memory)
    - Validates Permit via Fhenix Permit system
    - Returns: FHE.sealoutput(encryptedBalances[msg.sender], perm.publicKey)
    - Only the permit holder can decrypt the returned sealed value

  getEncryptedTotalEarned(Permission calldata perm) external view returns (string memory)
    - Same pattern as getEncryptedBalance but for total earned
```

**Contract: RewardDistributor.sol**

```
Core Logic:
  - Called by protocol admin or automated oracle
  - Receives plaintext reward amounts (from verified telemetry)
  - Encrypts amounts on-chain before depositing to NovaVault
  - Batch distribution support for gas efficiency

Functions:
  distributeRewards(address[] operators, uint32[] amounts) external onlyAdmin
    - For each operator: encrypt amount → call vault.depositReward()
    - Emits: BatchDistributed(count, block.timestamp)

  setVault(address _vault) external onlyOwner
```

**Testing Strategy:**
- Use `fhenix-hardhat-docker` for local FHE simulation
- Test encrypted deposit → encrypted balance increase
- Test claim flow with permit-based balance check
- Test access control (only distributor can deposit)
- Test edge cases: claim more than balance, zero deposits

---

### Module D: ZK Compliance Layer (Aleo)

**Purpose:** Leo smart contract that proves a device's GPS coordinates fall within an approved geographic region, without revealing the actual coordinates.

**Tools Required:**
- `leo` CLI (install via `cargo install leo-lang` or from Aleo GitHub releases)
- `snarkOS` (for local devnet testing)
- Rust toolchain (required by Leo)

**Program: compliance.aleo**

```leo
program compliance.aleo {
    // A geographic region is defined by bounding box coordinates
    // All coordinates are scaled by 1,000,000 for integer precision
    // e.g., latitude 25.033964 → 25033964

    struct DeviceLocation {
        lat: u64,      // latitude * 1_000_000
        lng: u64,      // longitude * 1_000_000
    }

    struct RegionBounds {
        min_lat: u64,
        max_lat: u64,
        min_lng: u64,
        max_lng: u64,
    }

    // Main transition: prove device is within region
    // Inputs: device location is PRIVATE, region bounds are PUBLIC
    // Output: boolean compliance result (PUBLIC)
    transition verify_compliance(
        private device: DeviceLocation,
        public region: RegionBounds,
        private device_id: field,
    ) -> public bool {
        // Verify latitude is within bounds
        let lat_ok: bool = device.lat >= region.min_lat && device.lat <= region.max_lat;

        // Verify longitude is within bounds
        let lng_ok: bool = device.lng >= region.min_lng && device.lng <= region.max_lng;

        // Device must be within both lat and lng bounds
        return lat_ok && lng_ok;
    }

    // Extended: verify compliance with Merkle proof for multi-region support
    // This allows a set of approved regions without revealing which one matched
    transition verify_compliance_merkle(
        private device: DeviceLocation,
        private region: RegionBounds,
        public region_merkle_root: field,
        private merkle_path: [field; 8],
        private merkle_indices: [bool; 8],
        private device_id: field,
    ) -> public bool {
        // 1. Verify region is in approved set via Merkle proof
        let region_hash: field = BHP256::hash_to_field(region);
        let computed_root: field = compute_merkle_root(
            region_hash, merkle_path, merkle_indices
        );
        assert_eq(computed_root, region_merkle_root);

        // 2. Verify device is within the (now-validated) region
        let lat_ok: bool = device.lat >= region.min_lat && device.lat <= region.max_lat;
        let lng_ok: bool = device.lng >= region.min_lng && device.lng <= region.max_lng;

        return lat_ok && lng_ok;
    }
}
```

**Key Design Decisions:**
- GPS coordinates use `u64` with 6 decimal places of precision (multiply by 1,000,000)
- Device location and device_id are always `private` inputs — never revealed
- Region bounds can be `public` (simple case) or `private` with Merkle proof (multi-region)
- The output is always a simple `public bool` — compliant or not
- Merkle tree depth of 8 supports up to 256 approved regions

**Frontend Integration (via Web Worker):**
- The Aleo SDK runs the Leo program client-side in the browser
- Proof generation happens in a Web Worker to avoid blocking the UI
- Estimated proof time: 10-30 seconds depending on device
- The generated proof can be verified on-chain or submitted to the relayer

---

## 4. Cross-Module Integration Points

```
                    ┌─────────────────────┐
                    │   Web Dashboard     │
                    │   (Module A)        │
                    │   Next.js Frontend  │
                    └──┬──────┬──────┬────┘
                       │      │      │
            ┌──────────┘      │      └──────────┐
            ▼                 ▼                  ▼
  ┌─────────────────┐ ┌──────────────┐ ┌────────────────┐
  │ Fhenix Chain    │ │ Aleo Network │ │ Hardware       │
  │ (Module C)      │ │ (Module D)   │ │ Relayer        │
  │                 │ │              │ │ (Module B)     │
  │ NovaVault.sol   │ │ compliance   │ │                │
  │ RewardDist.sol  │ │ .aleo        │ │ Express API    │
  │                 │ │              │ │    │           │
  │ FHE-encrypted   │ │ ZK proofs    │ │    ▼           │
  │ balances        │ │ generated    │ │ ┌───────────┐  │
  │                 │ │ client-side  │ │ │ IoTeX     │  │
  └─────────────────┘ └──────────────┘ │ │ ioID      │  │
                                       │ └───────────┘  │
                                       │    │           │
                                       │    ▼           │
                                       │ ┌───────────┐  │
                                       │ │ 0G DA     │  │
                                       │ │ Storage   │  │
                                       │ └───────────┘  │
                                       └────────────────┘
```

**Integration Rules:**
1. Module A connects to Module C via wagmi/viem (EVM wallet interaction)
2. Module A connects to Module D via Aleo SDK in Web Worker (client-side proving)
3. Module A connects to Module B via REST API (telemetry status, device management)
4. Module B is the ONLY component that talks to 0G DA and IoTeX ioID
5. Modules C and D do NOT communicate with each other directly
6. Module B does NOT depend on Fhenix or Aleo — it is purely IoTeX + 0G

---

## 5. Environment Configuration

```env
# === Fhenix (Module C) ===
FHENIX_RPC_URL=https://api.helium.fhenix.zone
FHENIX_CHAIN_ID=8008135
NOVA_VAULT_ADDRESS=0x...
REWARD_DISTRIBUTOR_ADDRESS=0x...
DEPLOYER_PRIVATE_KEY=0x...

# === Aleo (Module D) ===
ALEO_NETWORK=testnet
ALEO_PRIVATE_KEY=APrivateKey1...
ALEO_PROGRAM_ID=compliance.aleo

# === IoTeX (Module B) ===
IOTEX_RPC_URL=https://babel-api.testnet.iotex.io
IOTEX_CHAIN_ID=4690
IOID_REGISTRY_ADDRESS=0x...

# === 0G DA (Module B) ===
ZG_RPC_URL=https://evmrpc-testnet.0g.ai
ZG_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
ZG_DA_CONTRACT=0x...
ZG_PRIVATE_KEY=0x...

# === Frontend (Module A) ===
NEXT_PUBLIC_FHENIX_RPC_URL=https://api.helium.fhenix.zone
NEXT_PUBLIC_FHENIX_CHAIN_ID=8008135
NEXT_PUBLIC_NOVA_VAULT_ADDRESS=0x...
NEXT_PUBLIC_RELAYER_API_URL=http://localhost:3001
```

---

## 6. Non-Functional Requirements

**Performance:**
- ZK proof generation: < 30 seconds in browser (Web Worker)
- FHE contract interactions: < 15 seconds per transaction
- Telemetry relay: < 2 seconds end-to-end (receive → store)
- Dashboard load: < 3 seconds initial load

**Security:**
- Device authentication via signed payloads (ECDSA)
- No plaintext GPS data ever stored on-chain or in logs
- FHE private keys never leave the client
- Rate limiting on relayer API (100 req/min per device)

**Testing:**
- Unit tests for all contract functions (Hardhat + Chai)
- Integration tests for relayer API (Vitest + Supertest)
- E2E test for complete flow: submit telemetry → store on 0G → verify compliance → claim reward
- Leo program tests via `leo run` with sample inputs

---

## 7. Success Metrics (Per Buildathon Track)

**Fhenix Track:**
- [ ] NovaVault deployed on Fhenix testnet
- [ ] Encrypted deposit and claim flow working end-to-end
- [ ] Permit-based balance decryption demonstrated in frontend
- [ ] Demo video showing: connect wallet → view encrypted balance → claim reward

**Aleo Track:**
- [ ] compliance.aleo compiles and passes local tests
- [ ] ZK proof generation working in browser via Web Worker
- [ ] Frontend shows proof generation progress and result
- [ ] Demo video showing: input GPS → generate proof → verify compliance

**IoTeX Track:**
- [ ] Relayer accepts signed telemetry from simulated device
- [ ] ioID verification integrated and working
- [ ] Data successfully stored on 0G DA with receipt
- [ ] Demo video showing: device sends data → verified → stored on 0G → receipt returned
