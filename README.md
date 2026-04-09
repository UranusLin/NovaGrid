# NovaGrid

Privacy-first DePIN infrastructure. Hardware node operators prove regulatory compliance and earn encrypted rewards without exposing operational data.

## What It Does

Traditional DePIN networks expose everything on-chain — GPS locations, performance metrics, reward balances. NovaGrid solves this with two privacy layers:

**ZK Layer (Aleo):** Nodes prove location compliance and operational performance using zero-knowledge proofs. GPS coordinates and metrics are private inputs that never leave the operator's device.

**FHE Layer (Fhenix):** Reward balances are stored as fully homomorphic encrypted values on-chain. Only the operator can decrypt their own balance using the Fhenix Permit system.

These two layers connect: the Aleo trust score (a public ZK output) is used to weight encrypted reward distribution on Fhenix — high-performing nodes earn more, while individual amounts remain private.

## Architecture

```
[Operator's Browser]
  ├── GPS + metrics  →  Aleo ZK Worker (WASM)
  │                       ├── verify_compliance
  │                       ├── verify_device_credentials  
  │                       └── compute_node_score → trust_score (public)
  │
  └── Wallet + Permit →  Fhenix FHE Contracts
                          ├── NovaVault (encrypted balances)
                          └── RewardDistributor (trust_score weighted)

[Hardware Node]
  └── Telemetry → Hardware Relayer → IoTeX ioID → 0G DA Storage
```

## Modules

### ZK Compliance — `contracts/aleo-compliance/`

Leo program `compliance.aleo` with three transitions:

| Transition | Private Inputs | Public Inputs | Output |
|---|---|---|---|
| `verify_compliance` | GPS lat/lng, device_id | Region bounds | bool |
| `verify_device_credentials` | uptime %, hashrate, device_id | Min thresholds | bool |
| `compute_node_score` | Both bools, uptime, hashrate_score, device_id | — | u64 score |

The trust score (0–100) bridges Aleo proofs to Fhenix reward weighting.

### FHE Settlement — `contracts/fhenix-settlement/`

Solidity contracts on Fhenix using `@cofhe/sdk`:
- `NovaVault.sol` — encrypted reward balances (`euint32`)
- `RewardDistributor.sol` — distributes rewards weighted by trust score

### Web Dashboard — `apps/web-dashboard/`

Next.js 14 (App Router) frontend:
- `/` — Privacy Stack status panel
- `/compliance` — ZK proof generation (runs entirely in browser via Web Worker)
- `/rewards` — FHE balance view and claim (Fhenix Permit-based decryption)
- `/devices` — Device management

### Hardware Relayer — `apps/hardware-relayer/`

Node.js backend: IoTeX ioID device verification + 0G DA telemetry storage.

## Getting Started

### Prerequisites

- Node.js >= 18
- Leo CLI (for Aleo contracts): `cargo install leo-lang`

### Web Dashboard

```bash
npm install
npm run dev:web
```

Open http://localhost:3000

### Leo Program Tests

```bash
cd contracts/aleo-compliance
leo run verify_compliance --input inputs/verify_compliance.in
leo run verify_device_credentials --input inputs/verify_device_credentials.in
leo run compute_node_score --input inputs/compute_node_score.in
```

Expected outputs: `true`, `true`, `92u64`

### Deploy to Aleo Testnet

```bash
cd contracts/aleo-compliance
leo deploy --network testnet --endpoint https://api.explorer.provable.com/v1 --private-key $ALEO_PRIVATE_KEY --broadcast --yes
```

**Deployed:** `compliance.aleo` on Aleo Testnet  
**Deploy TX:** `at1pzqn6ea2gh9sne39fg20896rkhgevnvkqyda7wt84j58wz4c8grqs0dkca`  
**Address:** `aleo173cytqrq75ahm8t9l72kp3cr3uded75ac23xvylyks0eztt7hygq49w386`

## Privacy Model

| Data | Where it lives | Who can see it |
|---|---|---|
| GPS coordinates | Never leaves browser | Nobody |
| Uptime / hashrate | Never leaves browser | Nobody |
| Trust score | Public Aleo output | Everyone |
| Reward balance | Encrypted on Fhenix | Only the operator (via Permit) |
| Reward amounts | Never on-chain | Nobody |

## Build History

| Version | Description |
|---|---|
| v0.6.0 | FHE rewards dashboard: CoFHE integration, encrypted balances, ZK→FHE bridge UI |
| v0.5.1 | NovaVault + RewardDistributor deployed to Ethereum Sepolia |
| v0.5.0 | Fhenix FHE contracts complete: NovaVault + RewardDistributor, 8/8 tests pass |
| v0.4.0 | compliance.aleo deployed to Aleo Testnet (TX: at1pzqn6ea...0dkca) |
| v0.3.1 | Shield Wallet integration (required for Aleo competition) |
| v0.3.0 | Aleo module complete: Leo program + Next.js frontend + Web Worker proof generation |
| v0.2.0 | Monorepo root scaffold |
| v0.1.0 | Project init, design specs, competition docs |

## Fhenix Testnet Deployment

**Deployed on Ethereum Sepolia:**
- `NovaVault`:         `0xF3bd6CA6bA7c2D413693322ab64868CB329F968f`
- `RewardDistributor`: `0x27B1130bd453Da43E3b922B1AaB85f0a7252495F`
- Deployer:           `0x8BA9Ed59315cd272A43C4501Aa19450921dB441b`

```bash
cd contracts/fhenix-settlement
npm run deploy:sepolia    # deploy to Ethereum Sepolia
npm run deploy:arb        # deploy to Arbitrum Sepolia
```

## Competitions

- **Aleo Privacy Buildathon** — ZK compliance module (`contracts/aleo-compliance/`)
- **Fhenix dApp Buildathon** — FHE settlement module (`contracts/fhenix-settlement/`)
