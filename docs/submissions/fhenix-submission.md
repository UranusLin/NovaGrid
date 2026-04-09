# NovaGrid — Fhenix Track Submission

## Project Name
NovaGrid

## One-Line Description
DePIN reward distribution using Fhenix FHE to keep individual payout amounts encrypted on-chain while enabling trust-score-weighted incentives derived from Aleo ZK proofs.

## What We Built

NovaGrid stores and manages DePIN operator reward balances as `euint32` ciphertexts on Ethereum Sepolia using the CoFHE co-processor. Reward amounts are **never revealed on-chain** — only the operator can decrypt their own balance using a CoFHE permit.

The system is a two-contract FHE settlement layer:

### `NovaVault.sol`
Stores encrypted reward balances per operator.

| Function | Description |
|---|---|
| `depositReward(operator, InEuint32)` | Distributor deposits encrypted reward |
| `depositEncryptedReward(operator, euint32)` | Accepts pre-computed weighted ciphertext |
| `claimReward(InEuint32)` | Operator claims amount (FHE underflow guard via `FHE.select`) |
| `requestWithdraw(InEuint32)` | Operator requests withdrawal; emits `WithdrawRequested` event with encrypted handle |
| `getEncryptedBalance(address)` | Returns encrypted balance handle (operator/owner only) |
| `getEncryptedTotalEarned(address)` | Returns encrypted lifetime earnings handle |

**Key design decisions:**
- **Zero-handle initialization:** uninitialized `euint32` (handle=0) cannot participate in FHE operations. First deposit detects handle=0 and initializes with `FHE.asEuint32(0)` before calling `FHE.add`.
- **FHE underflow guard:** `claimReward` uses `FHE.gte` + `FHE.select` — if claim > balance, balance is left unchanged. No balance information is leaked (the guard runs entirely in the encrypted domain).
- **Withdraw gateway pattern:** `requestWithdraw` subtracts from the balance and emits an event with the encrypted handle. An off-chain relayer decrypts via permit and executes the actual payout.

### `RewardDistributor.sol`
Bridges the Aleo ZK layer to the Fhenix FHE layer.

| Function | Description |
|---|---|
| `distributeWeightedReward(operator, InEuint32, uint64 trustScore)` | Single weighted deposit |
| `distributeWeightedRewardBatch(operators[], InEuint32[], trustScores[])` | Gas-efficient batch distribution |
| `distributeRewards(operators[], InEuint32[])` | Equal-amount multi-operator distribution |

**ZK→FHE bridge:**
```
trustScore (public, from Aleo compute_node_score) × encryptedBase → encrypted weighted reward
FHE.mul(baseAmount, FHE.asEuint32(uint32(trustScore)))
```
The trust score is public (a scalar 40–100). The base amount is encrypted. The product remains encrypted — no individual amounts are revealed.

### Frontend: FHE Rewards Page

`apps/web-dashboard/src/app/rewards/page.tsx` and related components provide a complete UI for the FHE layer:

- **EncryptedBalance** — reads `euint32` handle + auto-decrypts via CoFHE permit. Shows loading skeleton, "Sign permit" button if permit missing, "Refresh permit" if expired.
- **ClaimForm** — encrypts claim amount client-side with `useCofheEncryptAndWriteContract`, polls for on-chain confirmation with `useWaitForTransactionReceipt`, shows human-readable FHE errors.
- **WeightedDepositForm** — reads ZK trust score from localStorage, encrypts base amount, calls `distributeWeightedReward`. Shows network guard if wrong chain.
- **WalletConnectButton** — handles MetaMask connect + auto-switch to Sepolia.

### Test Coverage

15 tests, 100% pass rate:
- Deployment state
- Access control (onlyOwner, onlyDistributor)
- Weighted distribution (single + batch)
- Trust score range validation
- Underflow guard (claim > balance → balance unchanged)
- requestWithdraw (with event verification + balance verification)
- E2E: ZK trust score → weighted deposit → claim → withdraw

## Technical Stack

- **Fhenix/CoFHE:** `@fhenixprotocol/cofhe-contracts` v0.1.3, Ethereum Sepolia
- **Testing:** `@cofhe/hardhat-plugin` v0.4.0, `mock_expectPlaintext` for plaintext verification
- **Frontend:** `@cofhe/react` v0.4.0, `@cofhe/sdk` v0.4.0
- **Wallet:** wagmi v2, viem v2, MetaMask injected connector

## Deployed Contracts (Ethereum Sepolia)

| Contract | Address |
|---|---|
| NovaVault | `0xF3bd6CA6bA7c2D413693322ab64868CB329F968f` |
| RewardDistributor | `0x27B1130bd453Da43E3b922B1AaB85f0a7252495F` |

## Privacy Model

| Data | Visibility |
|---|---|
| Individual reward amounts | Encrypted — only operator can decrypt |
| Total balance | Encrypted — only operator can decrypt |
| Lifetime earnings | Encrypted — only operator can decrypt |
| Trust score | Public (a scalar from Aleo ZK proof) |
| Weighted reward formula | Public (trustScore is plaintext, base is encrypted) |
| Which operators received rewards | Public (on-chain events) |
| How much each operator received | Encrypted |

## Repository

`contracts/fhenix-settlement/` — Solidity contracts, Hardhat tests, deployment scripts
`apps/web-dashboard/src/components/fhenix/` — React components for FHE operations
`apps/web-dashboard/src/app/rewards/` — FHE rewards page
`apps/web-dashboard/src/lib/contracts.ts` — Contract addresses and ABIs
