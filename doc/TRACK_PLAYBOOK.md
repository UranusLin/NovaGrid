# NovaGrid — Track Submission Playbook
# Version: 3.0 | Last Updated: 2026-03-26
# Target: AI coding assistants + Human builder (Elina)

---

## [AI ASSISTANT CONTEXT]

This document defines the BUILD ORDER and SUBMISSION STRATEGY for three parallel Buildathon tracks.
When asked to "work on Track X" or "prepare the Fhenix submission", refer to this document.
Each track has its own scope, deliverables, and demo script.
Do NOT mix track deliverables — each submission must appear self-contained.

---

## Current Wave Status (as of 2026-03-26)

| Track | Buildathon | Wave | Status | Urgency | Grant Pool |
|-------|-----------|------|--------|---------|------------|
| Fhenix | FHE Settlement | Wave 1 | Open for submission | 🔴 HIGHEST | TBD |
| IoTeX | Crypto's Got Talent S2 | Wave 1 | In review | 🟡 WAIT | $500K |
| Aleo | Aleo Buildathon | Wave 4 | Active | 🟠 HIGH | $50K |

---

## BUILD PRIORITY ORDER

```
WEEK 1 (NOW): ███████████ Fhenix Wave 1 submission
WEEK 2:       ██████████░ Aleo Wave 4/5 submission
WEEK 3+:      █████░░░░░░ IoTeX Wave 2 (based on Wave 1 feedback)
              ████████░░░ Iterate all tracks for next waves
```

---

## TRACK 1: FHENIX — FHE Settlement Layer
### Priority: 🔴 IMMEDIATE (Wave 1 submission)

### What to Build for Wave 1

**Minimum Viable Submission:**
1. ✅ `NovaVault.sol` deployed on Fhenix Helium testnet
2. ✅ `RewardDistributor.sol` deployed and linked to vault
3. ✅ Frontend `/rewards` page with:
   - Connect wallet (MetaMask)
   - View encrypted balance (shows "Encrypted 🔒" until permit)
   - Click "Decrypt Balance" → Fhenix Permit flow → show decrypted balance
   - Deposit reward (admin function for demo)
   - Claim reward with encrypted amount
4. ✅ Demo video (2-3 min)
5. ✅ Submission writeup

### Wave 1 Submission Writeup Template

```markdown
# NovaGrid — FHE-Powered Privacy for DePIN Rewards

## Problem
DePIN networks expose operator earnings on-chain. Anyone can see how much each
hardware node earns, creating competitive intelligence risks and security concerns
for operators running high-value infrastructure.

## Solution
NovaGrid uses Fhenix's Fully Homomorphic Encryption to encrypt all reward balances
on-chain. Operators accumulate and claim rewards without ever revealing amounts
publicly. Only the operator themselves can decrypt their balance using the Fhenix
Permit system.

## Technical Implementation
- **NovaVault.sol**: Stores all balances as `euint32` encrypted values
- **FHE Operations**: Uses `FHE.add()` for deposits, `FHE.sub()` for claims,
  `FHE.gte()` for balance verification — all computed on encrypted data
- **Permit System**: `FHE.sealoutput()` + client-side decryption via `fhenixjs`
- **Zero Plaintext**: No reward amounts are ever visible on-chain or in events

## What We Built This Wave
- Deployed NovaVault and RewardDistributor on Fhenix Helium testnet
- Frontend with encrypted balance display and Permit-based decryption
- End-to-end flow: deposit → encrypted accumulation → claim

## Tech Stack
- Solidity 0.8.24 + @fhenixprotocol/contracts v0.3.1
- Hardhat + fhenix-hardhat-plugin
- Next.js 14 + fhenixjs v0.4.1 + wagmi v2

## Demo Video
[Link to video]

## Deliverable URL
[GitHub repo link]

## What's Next (Wave 2 Preview)
- Batch reward distribution for multiple operators
- Historical encrypted earnings tracking
- Integration with DePIN telemetry verification
```

### Demo Video Script (Fhenix)

```
[Screen recording — 2-3 minutes]

0:00 — "This is NovaGrid, a privacy-first DePIN reward system built on Fhenix."

0:15 — Show the dashboard. "In traditional DePIN networks, all operator earnings
        are public on-chain. NovaGrid fixes this with FHE."

0:30 — Connect MetaMask to Fhenix Helium testnet.
        Show wallet connected state.

0:45 — Navigate to /rewards page.
        Show "Balance: Encrypted 🔒" state.
        "Right now, my balance is encrypted on-chain. Nobody can see it —
        not even the block explorer."

1:00 — Click "Decrypt My Balance" button.
        MetaMask popup for Permit signature.
        Sign the permit.
        Balance reveals: "1,250 NOVA tokens"
        "Only I can decrypt this using the Fhenix Permit system."

1:30 — Show the Fhenix block explorer.
        "If you look at the contract state, you'll see — the balance is stored
        as encrypted bytes. There's no plaintext amount anywhere."

1:50 — Click "Claim Reward" — enter 500 as claim amount.
        Show the encrypted transaction being processed.
        "Even the claim amount is encrypted in the transaction."

2:15 — Show updated balance after claim.
        "Balance is now 750 NOVA — still fully encrypted on-chain."

2:30 — Closing: "NovaGrid uses Fhenix FHE to bring financial privacy to
        DePIN infrastructure operators. Built with fhenixjs and
        @fhenixprotocol/contracts."
```

### Key Fhenix Judging Criteria to Hit
- **FHE is NOT optional** — it must be the core reason the product exists
- Show that you understand the Permit system (not just basic encryption)
- Demonstrate encrypted computation (add/sub/compare), not just storage
- Make it clear why privacy matters for YOUR use case specifically

---

## TRACK 2: ALEO — ZK Compliance Layer
### Priority: 🟠 HIGH (Wave 4 — entering mid-competition)

### What to Build for Wave 4/5

**Strategy Note:** You're entering at Wave 4. Competitors have 3 waves of iteration.
To stand out, your submission must show:
1. A non-trivial Leo program (not just hello-world)
2. Real-world use case relevance (GPS compliance is strong here)
3. Frontend integration (proof generation in browser)

**Minimum Viable Submission:**
1. ✅ `compliance.aleo` — Leo program with `verify_compliance` transition
2. ✅ Leo program compiles and passes `leo run` with test inputs
3. ✅ Frontend `/compliance` page with:
   - Input form for GPS coordinates (lat/lng)
   - Region selector (predefined approved regions)
   - "Generate Proof" button → Web Worker → proof result
   - Show proof generation progress (loading state)
   - Display compliance result (✅ Compliant / ❌ Non-compliant)
4. ✅ Demo video (2-3 min)

### Wave 4 Submission Writeup Template

```markdown
# NovaGrid — Zero-Knowledge Location Compliance for DePIN

## Problem
DePIN hardware operators must prove their devices are in approved geographic
regions for regulatory compliance. But sharing GPS coordinates on-chain
permanently exposes device locations — creating physical security risks for
high-value hardware installations.

## Solution
NovaGrid uses Aleo's Leo language to implement a ZK compliance circuit.
Hardware operators prove their device is within an approved geographic region
WITHOUT revealing the actual GPS coordinates. The output is a simple boolean:
compliant or not.

## How It Works
1. Operator inputs their device's GPS coordinates (kept PRIVATE)
2. The approved region bounds are PUBLIC parameters
3. The Leo program verifies: lat ∈ [min_lat, max_lat] AND lng ∈ [min_lng, max_lng]
4. A ZK proof is generated client-side in the browser
5. Only the boolean result (true/false) is revealed

## Technical Details
- **Leo Program**: `compliance.aleo` with `verify_compliance` transition
- **Coordinate Precision**: GPS scaled to u64 (6 decimal places × 1,000,000)
- **Privacy Guarantee**: Device location and device_id are `private` inputs
- **Client-Side Proving**: Aleo SDK runs in a Web Worker to avoid UI blocking
- **Future**: Merkle-proof variant supports 256 approved regions without revealing which one matched

## What We Built
- compliance.aleo program tested with multiple geographic regions
- Browser-based proof generation via Web Worker
- Frontend UI with coordinate input, region selection, and proof status

## Tech Stack
- Leo language + snarkOS
- @demox-labs/aleo-sdk (browser proving)
- Next.js 14 + Web Worker architecture

## Demo Video
[Link to video]

## Why Aleo
This use case is only possible on Aleo. Traditional blockchains would require
GPS coordinates to be submitted on-chain for verification. With Aleo's
private-by-default execution model, the coordinates never leave the operator's
browser. This is privacy that matters for physical security.
```

### Demo Video Script (Aleo)

```
[Screen recording — 2-3 minutes]

0:00 — "NovaGrid lets DePIN operators prove they're in an approved region
        without revealing their GPS coordinates."

0:15 — Show /compliance page. Explain the problem:
        "Mining regulations require proof of location. But sharing GPS
        on-chain is a security risk for expensive hardware installations."

0:30 — Select a region: "Taiwan Approved Zone"
        Show the region bounds on a simple map visualization.

0:45 — Enter GPS coordinates: lat 25.033, lng 121.565
        "These coordinates are my device's actual location.
        They will NEVER leave my browser."

1:00 — Click "Generate ZK Proof"
        Show loading spinner with progress:
        "Generating proof... this runs entirely client-side in a Web Worker."
        Wait 10-20 seconds.

1:30 — Proof complete! Show result: ✅ Compliant
        "The proof confirms my device is in the approved region.
        But nobody — not even the verifier — knows WHERE exactly."

1:50 — Show the proof output: just a boolean + proof bytes.
        "This is all that gets shared. No GPS coordinates.
        No identifiable location data. Just: compliant."

2:10 — Try with out-of-bounds coordinates.
        Show result: ❌ Non-compliant
        "If the device is outside the region, the proof fails."

2:30 — Closing: "Built with Aleo's Leo language. Private inputs,
        public verification. This is what ZK compliance looks like."
```

### Key Aleo Judging Criteria to Hit
- **Privacy must be the core feature**, not an add-on
- Show you understand Aleo's private/public input model
- Demonstrate a real use case (GPS compliance is very strong)
- Leo code must be non-trivial — show struct types, comparisons, logic
- Web integration via SDK differentiates from CLI-only projects

---

## TRACK 3: IOTEX — DePIN Data Relayer
### Priority: 🟡 WAIT FOR WAVE 1 FEEDBACK, then iterate

### What to Build for Wave 2

**After Wave 1 Review Feedback:**
Adjust scope based on what judges liked/disliked. Focus areas:

1. ✅ Hardware Relayer API with ioID device verification
2. ✅ 0G DA integration for telemetry storage
3. ✅ Device registration and management flow
4. ✅ Frontend `/devices` page showing registered devices and telemetry status
5. ✅ Demo video showing end-to-end data flow

### Wave 2 Submission Writeup Template

```markdown
# NovaGrid — Secure DePIN Data Infrastructure with IoTeX + 0G

## Problem
DePIN networks need a trustworthy pipeline from physical hardware to on-chain
state. Current approaches either lack device identity verification (anyone
can submit fake data) or store raw telemetry on expensive L1 storage.

## Solution
NovaGrid combines IoTeX's ioID for device identity verification with 0G's
Data Availability layer for scalable off-chain storage. Only verified devices
can submit data, and all telemetry is stored with DA guarantees without
expensive on-chain storage costs.

## Architecture
1. **Hardware Node** → Sends signed telemetry payload
2. **NovaGrid Relayer** → Verifies device identity via ioID registry on IoTeX
3. **Data Processing** → Validates, normalizes, and encrypts sensitive fields
4. **0G DA Storage** → Stores telemetry blob with Merkle root commitment
5. **Receipt** → Returns DA receipt (txHash, rootHash) to device

## Key IoTeX Integration
- **ioID Verification**: Every telemetry submission is authenticated against
  the IoTeX ioID registry. Unregistered devices are rejected.
- **Device DID**: Each hardware node has an on-chain DID document on IoTeX
  containing its public key for signature verification.
- **On-Chain Anchoring**: DA receipts can optionally be anchored to IoTeX
  for tamper-proof audit trails.

## Tech Stack
- Node.js + Express + TypeScript (Relayer)
- iotex-antenna v0.31.x (ioID verification)
- @0glabs/0g-ts-sdk v0.3.x (DA storage)
- ethers v6 (blockchain interactions)
- Next.js 14 (Dashboard)

## Demo Video
[Link to video]
```

---

## CROSS-TRACK COORDINATION

### Shared Components (build once, use everywhere)

| Component | Used By | Build When |
|-----------|---------|------------|
| Web3Provider.tsx | All tracks | Week 1 (Fhenix) |
| Dashboard layout | All tracks | Week 1 (Fhenix) |
| Wallet connect UI | All tracks | Week 1 (Fhenix) |
| Dark theme + Tailwind | All tracks | Week 1 (Fhenix) |

### GitHub Repo Strategy

```
README.md structure:

# NovaGrid — Privacy-First DePIN Infrastructure

## Overview
[General project description — keep it neutral across tracks]

## Architecture
[Show the full 4-module diagram]

## Modules

### 🔐 FHE Settlement (Fhenix)
[Brief description + link to contracts/fhenix-settlement/]

### 🛡️ ZK Compliance (Aleo)
[Brief description + link to contracts/aleo-compliance/]

### 📡 Data Relayer (IoTeX + 0G)
[Brief description + link to apps/hardware-relayer/]

### 🖥️ Web Dashboard
[Brief description + link to apps/web-dashboard/]

## Getting Started
[Setup instructions for each module]
```

**IMPORTANT:** When submitting to each Buildathon, link to the SAME GitHub repo
but point judges to the specific module's directory. The README should make it
easy to navigate to any module independently.

---

## IMPLEMENTATION COMMANDS

### Initialize Monorepo

```bash
mkdir novagrid-monorepo && cd novagrid-monorepo
npm init -y
# Edit package.json to add workspaces

mkdir -p apps/web-dashboard apps/hardware-relayer
mkdir -p contracts/fhenix-settlement contracts/aleo-compliance
mkdir -p docs
```

### Module A: Web Dashboard

```bash
cd apps/web-dashboard
npx create-next-app@14 . --typescript --tailwind --app --src-dir --no-eslint
npm install wagmi@^2.12.0 viem@^2.21.0 @tanstack/react-query@^5.50.0
npm install fhenixjs@^0.4.1
npm install @headlessui/react@^2.1.0 lucide-react@^0.400.0
```

### Module B: Hardware Relayer

```bash
cd apps/hardware-relayer
npm init -y
npm install express@^4.19.0 cors@^2.8.5 helmet@^7.1.0 zod@^3.23.0 winston@^3.13.0
npm install @0glabs/0g-ts-sdk@^0.3.3 iotex-antenna@^0.31.0 ethers@^6.11.0
npm install -D typescript@^5.5.0 @types/express@^4.17.21 @types/cors@^2.8.17 tsx@^4.15.0 vitest@^1.6.0
```

### Module C: Fhenix Contracts

```bash
cd contracts/fhenix-settlement
npm init -y
npx hardhat init  # Choose TypeScript project
npm install @fhenixprotocol/contracts@^0.3.1 @openzeppelin/contracts@^5.0.0
npm install -D fhenix-hardhat-plugin@latest fhenix-hardhat-docker@latest
```

### Module D: Aleo Compliance

```bash
cd contracts/aleo-compliance
leo new compliance
# This creates the Leo project structure
```

---

## SUBMISSION CHECKLIST (Per Track)

### Before Every Submission:

- [ ] Demo video recorded (2-3 min max)
- [ ] Video shows ONLY this track's features (no cross-track references)
- [ ] Submission writeup completed
- [ ] GitHub repo README updated with clear module navigation
- [ ] All code compiles/builds without errors
- [ ] Testnet deployment verified (if applicable)
- [ ] Deliverable URL working and accessible
- [ ] Product description focuses on THIS ecosystem's value proposition
- [ ] No mentions of competing chains in submission text

### Track-Specific Checks:

**Fhenix:**
- [ ] NovaVault deployed on Helium testnet
- [ ] Permit-based decryption working in frontend
- [ ] Block explorer shows encrypted (not plaintext) state

**Aleo:**
- [ ] `leo build` passes without errors
- [ ] `leo run verify_compliance` produces correct output
- [ ] Frontend Web Worker generates proof successfully
- [ ] Test with both compliant and non-compliant coordinates

**IoTeX:**
- [ ] Relayer API responds to POST /api/telemetry
- [ ] ioID verification rejects unregistered devices
- [ ] 0G DA upload returns valid receipt
- [ ] Frontend shows device list and status

---

## DIFFERENTIATION STRATEGY

### What Makes NovaGrid Stand Out From Other Submissions

1. **Real-World Anchoring**: The builder (Elina) has actual hardware product
   experience (HAKO METAL). This is not a theoretical DePIN project — it's
   designed for real mining hardware infrastructure. Mention this in submissions.

2. **TradFi Risk Framework Applied to DePIN**: Apply Basel III / IFRS9 concepts
   (PD, LGD, EAD) to DePIN node creditworthiness scoring. This cross-domain
   expertise is extremely rare in crypto hackathons.

3. **Privacy as Infrastructure, Not Feature**: NovaGrid doesn't add privacy as
   an afterthought. The entire architecture is designed around the principle
   that DePIN operational data should be private by default.

4. **Production Mindset**: The codebase uses proper error handling, typed schemas
   (Zod), structured logging (Winston), and testing. This signals to judges
   that the project is built to last, not just to demo.
