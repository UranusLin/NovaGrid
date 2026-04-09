# NovaGrid — Aleo Track Submission

## Project Name
NovaGrid

## One-Line Description
Privacy-first DePIN infrastructure using Aleo zero-knowledge proofs to verify device compliance without revealing location or operational data.

## What We Built

NovaGrid proves DePIN node compliance using Aleo's Leo programming language. Hardware nodes (routers, miners, sensors) must prove they are:
1. **Located within an approved geographic region** — without revealing GPS coordinates
2. **Meeting operational thresholds** (uptime %, hashrate) — without exposing actual performance metrics
3. **Generating a public trust score (40–100)** — used for reward weighting on Fhenix (Ethereum Sepolia)

### Aleo Program: `compliance.aleo`

Deployed to Aleo Testnet at transaction: `at1pzqn6ea2gh9sne39fg20896rkhgevnvkqyda7wt84j58wz4c8grqs0dkca`

**Transitions:**

| Transition | Private Inputs | Public Inputs | Output |
|---|---|---|---|
| `verify_compliance` | device GPS, device_id | region bounds | `bool` (location compliant) |
| `verify_device_credentials` | uptime_pct, hashrate, device_id | min thresholds | `bool` (ops compliant) |
| `compute_node_score` | location_ok, ops_ok, uptime, hashrate, device_id | — | `u64` trust score (40–100) |
| `emit_compliance_record` | owner, device_id, score, nonce | — | `ComplianceRecord` (private on-chain record) |

**Privacy model:**
- GPS coordinates are **private inputs** — never appear on-chain or in any proof transcript
- Operational metrics are **private inputs** — only the pass/fail result is revealed
- The **trust score is public** — a scalar (40–100) used to weight FHE rewards. No individual metric is recoverable from this single number
- `ComplianceRecord` is a **private record** — only the owner can read it, provably linking the proof to a device identity

### Frontend ZK Prover

Built with Next.js + the Aleo SDK running in a Web Worker. All proof generation runs entirely client-side:

- `apps/web-dashboard/src/workers/aleo.worker.ts` — Web Worker that runs Leo transitions in the browser
- `apps/web-dashboard/src/hooks/useAleoWorker.ts` — React hook that orchestrates the multi-step proof pipeline
- `apps/web-dashboard/src/components/aleo/ComplianceProver.tsx` — User-facing form

After a proof completes, the trust score (a public output) is:
1. Saved to localStorage
2. Used as input to the Fhenix reward weighting (ZK→FHE bridge)
3. A "Use Score in FHE Rewards →" CTA navigates the user directly to the rewards page

### Hardware Relayer (Module B)

`services/hardware-relayer/` — A Node.js Express service that runs the same compliance pipeline server-side for real hardware devices:
1. Device reports metrics via `POST /api/v1/report` (authenticated with API key)
2. Relayer runs `leo run verify_compliance` / `verify_device_credentials` / `compute_node_score`
3. If compliant, submits trust score to Fhenix `RewardDistributor.distributeWeightedReward`

## Technical Stack

- **Aleo:** Leo v4.0.0 (`fn` syntax, `@noupgrade constructor()`, record types)
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, `@demox-labs/aleo-sdk`
- **Web Worker:** Aleo WASM SDK for browser-based proof generation
- **Wallet:** Shield Wallet Adapter (`@provablehq/aleo-wallet-adaptor-shield`)

## ZK → FHE Bridge

The trust score output from `compute_node_score` is a public value that bridges to the Fhenix layer:

```
Aleo ZK Proof → trust_score (public u64, 40–100)
       ↓
RewardDistributor.distributeWeightedReward(operator, encryptedBase, trustScore)
       ↓
FHE: weighted = encryptedBase × trustScore  (all stays encrypted on-chain)
       ↓
NovaVault: operator's encrypted balance updated
```

High-score nodes earn proportionally more, while individual base amounts remain private.

## Repository

`contracts/aleo-compliance/` — Leo program source and deployment scripts
`apps/web-dashboard/` — Next.js frontend with in-browser proof generation
`services/hardware-relayer/` — Node.js server-side relayer for physical devices
