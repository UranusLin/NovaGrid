---
name: NovaGrid Updated Design
description: NovaGrid privacy-first DePIN infrastructure — updated design after competition analysis
type: project
---

# NovaGrid — Updated Design Spec
**Date:** 2026-04-07
**Status:** Approved

---

## 1. Competition Scope (Revised)

| Track | Buildathon | Status | Priority |
|-------|-----------|--------|---------|
| Aleo | Privacy Buildathon | Building — 6 days left (Wave 4) | 🔴 HIGHEST |
| Fhenix | Privacy-by-Design dApp Buildathon | Judging Wave 2, Wave 3 Marathon starts 4/8 | 🟠 HIGH |
| IoTeX | Crypto's Got Talent S2 | **DROPPED** — requires live X Spaces & demo broadcasts | ❌ |

**IoTeX Decision:** CGT requires live broadcast participation (X Spaces, demo livestreams, finals). Not feasible. Module B (hardware relayer) code will still be built as supporting infrastructure for the demo story, but CGT will not be submitted to.

---

## 2. Core Design Concept: ZK → FHE Cross-Module Bridge

The key architectural insight is connecting Aleo and Fhenix into a coherent system:

```
[Aleo ZK Layer]
  Node proves: location compliance + operational performance
  → outputs public trust_score (0–100)
        ↓
[Fhenix FHE Layer]
  trust_score weights encrypted reward distribution
  → individual amounts stay private, but high-score nodes earn more
```

This makes NovaGrid a unified privacy infrastructure rather than three disconnected tools. The narrative across both submissions:
- **Aleo**: "Privacy-preserving DePIN node credentialing via ZK"
- **Fhenix**: "Trust-score-weighted encrypted reward distribution via FHE"

---

## 3. Module D — Aleo Leo Program (Updated)

**Program:** `compliance.aleo`

### Three Transitions

#### 3.1 `verify_compliance` (original)
Proves device GPS coordinates fall within an approved region.

```leo
transition verify_compliance(
    private device: DeviceLocation,   // lat/lng * 1_000_000 as u64
    public region: RegionBounds,      // public bounding box
    private device_id: field,
) -> public bool
```

Private: device location, device_id
Public: region bounds, result bool

#### 3.2 `verify_device_credentials` (new)
Proves device meets minimum operational thresholds.

```leo
transition verify_device_credentials(
    private uptime_pct: u64,        // 0–100
    private hashrate: u64,          // normalized value
    public min_uptime: u64,         // public threshold
    public min_hashrate: u64,       // public threshold
    private device_id: field,
) -> public bool
```

Private: actual uptime, actual hashrate, device_id
Public: minimum thresholds, result bool

#### 3.3 `compute_node_score` (new — cross-module bridge)
Combines both compliance results into a single trust score. This public output is used by Fhenix for reward weighting.

```leo
transition compute_node_score(
    private location_ok: bool,
    private ops_ok: bool,
    private uptime_pct: u64,
    private hashrate_score: u64,   // normalized 0–100
    private device_id: field,
) -> public u64 {
    assert(location_ok);
    assert(ops_ok);
    // 40% geo compliance base + 30% uptime + 30% hashrate
    let score: u64 = 40u64
        + (uptime_pct * 30u64 / 100u64)
        + (hashrate_score * 30u64 / 100u64);
    return score;  // 0–100
}
```

Private: all underlying metrics, device_id
Public: final score (used as reward weight)

### Shield Wallet Integration (MANDATORY per Aleo rules)
- All wallet interactions in frontend must use Shield Wallet adapter
- Replace generic wallet connect with Shield Wallet
- Docs: https://shield-wallet-adapter-docs (from competition resources)

### Frontend `/compliance` Page
- Input: GPS lat/lng (private, never leaves browser)
- Input: uptime % and hashrate (private)
- Region selector (public, predefined list)
- "Generate Proof" → Web Worker → 10–30s progress indicator
- Output: ✅/❌ for each transition + final trust score display
- Shield Wallet connect button

---

## 4. Module C — Fhenix Contracts (Updated)

**SDK Change:** Use `@cofhe/sdk` + `@cofhe/react` (NOT `fhenixjs@^0.4.1`).
The CoFHE stack is the current competition-recommended SDK with React hooks (`useEncrypt`, `useDecrypt`, `useWrite`).

### NovaVault.sol (same core, SDK-adapted)
- `depositReward(address operator, inEuint32 encryptedAmount)` — distributor only
- `claimReward(inEuint32 encryptedClaimAmount)` — operator only
- `getEncryptedBalance(Permission perm)` — permit-gated view
- `getEncryptedTotalEarned(Permission perm)` — permit-gated view

### RewardDistributor.sol (new: trust-score weighted distribution)

```solidity
// Standard equal distribution
function distributeRewards(address[] operators, uint32[] amounts)
    external onlyAdmin

// NEW: trust-score weighted distribution (cross-module bridge)
function distributeWeightedReward(
    address operator,
    inEuint32 calldata baseAmount,
    uint64 trustScore        // public, sourced from Aleo compute_node_score output
) external onlyDistributor {
    euint32 amount = FHE.asEuint32(baseAmount);
    // trustScore is public, baseAmount stays encrypted
    // Result: high-score nodes earn more, but individual amounts remain private
    euint32 weighted = FHE.mul(amount, FHE.asEuint32(uint32(trustScore)));
    _encryptedBalances[operator] = FHE.add(_encryptedBalances[operator], weighted);
    emit RewardDeposited(operator, block.timestamp);
}
```

### Frontend `/rewards` Page
- Uses `@cofhe/react` hooks: `useEncrypt`, `useDecrypt`, `useWrite`
- Show "Encrypted 🔒" placeholder until permit-based decrypt
- Input trust score from Aleo proof for weighted deposit demo
- Claim flow with encrypted amount input

---

## 5. Module A — Web Dashboard (Updated)

### Privacy Layers Status Panel (new — main dashboard)

```
┌─────────────────────────────────────┐
│  NovaGrid Privacy Stack             │
│  ─────────────────────────────────  │
│  🛡 ZK Layer (Aleo)    ● Active     │
│     Node Score: 87/100              │
│  🔐 FHE Layer (Fhenix) ● Active     │
│     Balance: Encrypted 🔒           │
│  📡 DA Layer (0G)      ● Synced     │
│     Last relay: 2m ago              │
└─────────────────────────────────────┘
```

### Routes
| Route | Purpose |
|-------|---------|
| `/` | Dashboard — Privacy Layers panel + connected wallet |
| `/compliance` | Aleo ZK proof generation (3 transitions + Shield Wallet) |
| `/rewards` | Fhenix encrypted balance + claim (CoFHE SDK) |
| `/devices` | Device list + 0G relay status (no CGT submission, still built) |

### Tech Stack (confirmed)
- Next.js 14 (App Router) + React 18 + TypeScript strict
- wagmi v2 + viem v2
- `@cofhe/sdk` + `@cofhe/react` (Fhenix)
- `@demox-labs/aleo-sdk` in Web Worker (Aleo)
- Shield Wallet adapter (Aleo — mandatory)
- TailwindCSS v3.4, dark theme, desktop-first

---

## 6. Module B — Hardware Relayer (Supporting Infrastructure)

Built but not submitted to CGT. Serves as:
- Demo backend for `/devices` page
- Supporting evidence of full-stack DePIN architecture in Aleo/Fhenix submissions

Tech: Node.js + Express + TypeScript + `@0glabs/0g-ts-sdk` + `iotex-antenna`

---

## 7. Build Priority & Timeline

```
TODAY (4/7):    Monorepo scaffold + git init
Day 1–3 (4/7–4/9):   Module D (Aleo Leo program, 3 transitions)
                       Module A /compliance page + Shield Wallet
Day 4–6 (4/10–4/12):  Wave 4 Aleo submission
Day 7+ (4/8→):        Module C (Fhenix contracts, @cofhe/sdk)
                       Module A /rewards page
                       Fhenix Wave 3 Marathon submission
Later:                 Module B (relayer, as supporting infra)
```

---

## 8. Key Technical Constraints

1. All packages must match pinned versions in PRD.md (except Fhenix SDK → @cofhe/sdk)
2. TypeScript strict mode everywhere, no `any`
3. Aleo proof generation MUST run in Web Worker
4. FHE private keys never leave client
5. Shield Wallet is mandatory for Aleo frontend
6. Git commits use semver tags (v0.1.0, v0.2.0...), no AI co-author tags
7. GPS coordinates never stored on-chain or in logs

---

## 9. Submission Requirements Summary

### Aleo (Wave 4 — ~6 days)
- [ ] `compliance.aleo` with 3 transitions deployed on Aleo Testnet
- [ ] Shield Wallet integrated
- [ ] Frontend with proof generation UI
- [ ] Project Overview: name, problem, why privacy, PMF + GTM
- [ ] Progress Changelog (Wave 4 is first submission → describe what was built)
- [ ] GitHub repo with README + architecture overview + privacy model explanation

### Fhenix (Wave 3 Marathon — starts 4/8)
- [ ] NovaVault + RewardDistributor deployed on Fhenix testnet
- [ ] `distributeWeightedReward` demonstrating cross-module trust score usage
- [ ] Frontend /rewards page with CoFHE SDK hooks
- [ ] Permit-based balance decryption demo
- [ ] Submission writeup on Akindo platform
