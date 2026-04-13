# NovaGrid

<p align="center">
  <img src="apps/web-dashboard/public/logo-readme.svg" alt="NovaGrid" height="56"/>
</p>

<p align="center">
  <strong>The privacy infrastructure layer every DePIN network needs.</strong>
</p>

<p align="center">
  <a href="https://ethereum.org/en/developers/docs/networks/#sepolia">
    <img src="https://img.shields.io/badge/Ethereum-Sepolia-627EEA?logo=ethereum&logoColor=white" alt="Ethereum Sepolia"/>
  </a>
  <a href="https://www.aleo.org/">
    <img src="https://img.shields.io/badge/Aleo-Testnet-00D4AA?logoColor=white" alt="Aleo Testnet"/>
  </a>
  <a href="https://fhenix.io/">
    <img src="https://img.shields.io/badge/Fhenix-FHE-5B6EFF?logoColor=white" alt="Fhenix"/>
  </a>
  <a href="https://0g.ai/">
    <img src="https://img.shields.io/badge/0G-DA-FF6B35?logoColor=white" alt="0G"/>
  </a>
</p>

---

NovaGrid is not another DePIN network — it's a privacy middleware layer that plugs into existing ones. Hardware node operators prove compliance with zero-knowledge proofs, earn rewards stored as FHE ciphertexts, and relay telemetry through decentralised storage. No location, identity, or balance ever exposed.

---

## The Problem

Every DePIN protocol today has the same privacy gap:

| What it needs to verify | What it actually exposes |
|---|---|
| Node is in an approved region | Public GPS coordinates |
| Node meets performance thresholds | Public uptime / hashrate metrics |
| Reward was distributed correctly | Public balance visible to everyone |

Competitors can map your entire node fleet. Anyone watching the chain knows your earnings. This is a solved problem in cryptography — DePIN just hasn't applied it yet.

## The Solution

NovaGrid provides three composable privacy layers any DePIN protocol can integrate:

| Layer | Technology | What it hides |
|---|---|---|
| ZK Compliance | Aleo (Leo programs) | GPS coordinates, performance metrics |
| FHE Rewards | Fhenix + CoFHE | Reward balances, claim amounts, node rankings |
| DA Storage | 0G | Centralised relay server dependency |

The layers connect: the ZK proof produces a public **trust score** (0–100) which weights encrypted reward distribution on Fhenix — high-performing nodes earn more, while individual amounts stay private.

---

## Architecture

```
[Operator's Browser]
  ├── GPS + metrics  ──►  Aleo ZK Worker (WASM, runs in browser)
  │                         ├── verify_compliance         (location proof)
  │                         ├── verify_device_credentials (performance proof)
  │                         └── compute_node_score  ──►   trust_score (public u64)
  │
  └── Wallet + Permit ──►  Fhenix FHE Contracts (Ethereum Sepolia)
                             ├── NovaVault           (euint32 encrypted balances)
                             ├── RewardDistributor   (trust_score weighted deposits)
                             └── PrivacyLeaderboard  (FHE.lt encrypted ranking)

[Hardware Node]
  └── Telemetry ──► Hardware Relayer ──► 0G DA Storage
```

**Privacy boundary:** Everything private stays in the browser. The only thing that ever hits a public chain is the trust score and the FHE ciphertext — both opaque to observers.

---

## Contracts

### ZK Compliance — `contracts/aleo-compliance/`

Leo program `compliance.aleo` deployed on Aleo Testnet:

| Transition | Private Inputs | Public Inputs | Output |
|---|---|---|---|
| `verify_compliance` | GPS lat/lng, device_id | Region bounds | bool |
| `verify_device_credentials` | uptime %, hashrate, device_id | Min thresholds | bool |
| `compute_node_score` | Both bools, uptime, hashrate_score, device_id | — | u64 score |

**Deployed:** `compliance.aleo` on Aleo Testnet  
**Deploy TX:** `at1pzqn6ea2gh9sne39fg20896rkhgevnvkqyda7wt84j58wz4c8grqs0dkca`

### FHE Settlement — `contracts/fhenix-settlement/`

Solidity contracts on Ethereum Sepolia using `@cofhe/sdk`:

| Contract | Address | Purpose |
|---|---|---|
| `NovaVault` | `0xF3bd6CA6bA7c2D413693322ab64868CB329F968f` | Encrypted reward balances (`euint32`), Permit-based access |
| `RewardDistributor` | `0x27B1130bd453Da43E3b922B1AaB85f0a7252495F` | Trust-score weighted encrypted deposits |
| `PrivacyLeaderboard` | `0xAd3710ba23753edd19d715F13254657137A367F4` | Private node ranking via `FHE.lt` comparisons |

**FHE operations used across contracts:**

| Operation | Where |
|---|---|
| `FHE.add` | Accumulate encrypted rewards + rank counter |
| `FHE.sub` | Encrypted claim subtraction |
| `FHE.mul` | Trust-score weighted reward calculation |
| `FHE.gte` | Underflow guard (balance ≥ claim amount) |
| `FHE.lt` | Per-node encrypted comparison for ranking |
| `FHE.select` | Encrypted conditional (if/else on `ebool`) |

---

## Web Dashboard — `apps/web-dashboard/`

Next.js 15 (App Router):

| Route | Description |
|---|---|
| `/` | Landing page — value proposition and how it works |
| `/dashboard` | Privacy layers status panel + module navigation |
| `/compliance` | ZK proof generation (Aleo WASM, runs in browser) |
| `/rewards` | FHE balance, claim, weighted deposit, private leaderboard |
| `/devices` | Device management and telemetry |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9
- Leo CLI (for Aleo contracts): `cargo install leo-lang`

### Install & Run

```bash
pnpm install
pnpm dev          # starts web dashboard + hardware relayer
```

Open http://localhost:3000

### Leo Contract Tests

```bash
cd contracts/aleo-compliance
leo run verify_compliance --input inputs/verify_compliance.in
leo run verify_device_credentials --input inputs/verify_device_credentials.in
leo run compute_node_score --input inputs/compute_node_score.in
# Expected: true, true, 92u64
```

---

## Demo Walkthrough

5-minute demo for hackathon judges. Goal: show that private inputs never leave the browser.

**Step 1 — ZK Compliance (Aleo)**
1. Open `/compliance`, connect Shield Wallet
2. Enter GPS coordinates and performance metrics → click **Generate ZK Proof**
3. Proof runs in WASM inside the browser — trust score appears (e.g. 92/100)
4. *Key point:* GPS and metrics are private inputs. Only the trust score is public output.

**Step 2 — FHE Rewards (Fhenix)**
1. Open `/rewards`, connect MetaMask on Ethereum Sepolia
2. Click **Weighted Deposit** — reward = base × trust_score, stored as `euint32` ciphertext
3. Balance shows as `[encrypted]` on-chain — click **Sign Permit** to decrypt your own value
4. *Key point:* Even the smart contract cannot read the balance. Only the permit holder can decrypt.

**Step 3 — Private Leaderboard**
1. Still on `/rewards`, scroll to **Private Node Leaderboard**
2. Click **Submit Encrypted Score** — trust score is encrypted client-side before submission
3. Click **Compute My Rank** — `FHE.lt` compares your score against every other node inside the FHE co-processor
4. Decrypt your rank with a permit — see how many nodes score below you
5. *Key point:* Nobody sees anyone else's score. The comparison happens entirely in ciphertext.

---

## Privacy Model

| Data | Where it lives | Who can see it |
|---|---|---|
| GPS coordinates | Never leaves browser | Nobody |
| Uptime / hashrate | Never leaves browser | Nobody |
| Trust score | Public Aleo output | Everyone (by design) |
| Reward balance | FHE ciphertext on Fhenix | Only the operator (via Permit) |
| Reward amounts | Never on-chain in plaintext | Nobody |
| Node ranking | FHE ciphertext (computed in co-processor) | Only the querying node |
| Device telemetry | 0G DA | Permissioned |

---

## Build History

| Version | Description |
|---|---|
| v0.9.0 | PrivacyLeaderboard (FHE.lt ranking), logo, navigation fixes |
| v0.8.0 | Landing page, Navbar, Docker setup, privacy-layer positioning |
| v0.7.0 | FHE underflow guard, batch distribute, hardware relayer, ZK→FHE bridge UI |
| v0.6.0 | FHE rewards dashboard: CoFHE integration, encrypted balances |
| v0.5.0 | Fhenix FHE contracts: NovaVault + RewardDistributor, 8/8 tests pass |
| v0.4.0 | compliance.aleo deployed to Aleo Testnet |
| v0.3.0 | Aleo module: Leo program + Web Worker proof generation |
| v0.2.0 | Monorepo scaffold |
| v0.1.0 | Project init, design specs |

---

## Competitions

- **Fhenix Privacy-by-Design dApp Buildathon** — FHE settlement module (`contracts/fhenix-settlement/`)
- **Aleo Privacy Buildathon** — ZK compliance module (`contracts/aleo-compliance/`)
