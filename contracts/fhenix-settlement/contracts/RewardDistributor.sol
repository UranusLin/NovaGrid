// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NovaVault.sol";

/// @title RewardDistributor
/// @notice Distributes encrypted rewards to DePIN node operators.
/// Supports equal distribution and trust-score-weighted distribution.
/// The trust score is the public output of the Aleo compute_node_score ZK transition —
/// this is the cross-module bridge between the ZK layer (Aleo) and the FHE layer (Fhenix).
contract RewardDistributor is Ownable {
    NovaVault public vault;

    // Minimum and maximum valid trust score range (matches Aleo compute_node_score output)
    uint64 public constant TRUST_SCORE_MIN = 40;
    uint64 public constant TRUST_SCORE_MAX = 100;

    event RewardsDistributed(address[] operators, uint256 timestamp);
    event WeightedRewardDistributed(
        address indexed operator,
        uint64 trustScore,
        uint256 timestamp
    );

    constructor(address _vault) Ownable(msg.sender) {
        vault = NovaVault(_vault);
    }

    /// @notice Distribute equal encrypted rewards to multiple operators.
    /// @param operators List of operator addresses
    /// @param amounts List of client-encrypted reward amounts (one per operator)
    function distributeRewards(
        address[] calldata operators,
        InEuint32[] memory amounts
    ) external onlyOwner {
        require(operators.length == amounts.length, "RewardDistributor: length mismatch");
        for (uint256 i = 0; i < operators.length; i++) {
            vault.depositReward(operators[i], amounts[i]);
        }
        emit RewardsDistributed(operators, block.timestamp);
    }

    /// @notice Distribute a trust-score-weighted encrypted reward to an operator.
    /// @dev This is the ZK→FHE cross-module bridge:
    ///   - baseAmount is encrypted (private) — provided by distributor
    ///   - trustScore is public — sourced from the Aleo compute_node_score ZK proof output
    ///   - weighted = baseAmount × trustScore (individual amounts remain private)
    ///   High-score nodes earn more; no individual amounts are revealed on-chain.
    /// @param operator The operator receiving the reward
    /// @param baseAmount Client-encrypted base reward unit
    /// @param trustScore Public trust score from Aleo (range 40–100)
    function distributeWeightedReward(
        address operator,
        InEuint32 memory baseAmount,
        uint64 trustScore
    ) external onlyOwner {
        require(
            trustScore >= TRUST_SCORE_MIN && trustScore <= TRUST_SCORE_MAX,
            "RewardDistributor: trustScore out of range [40,100]"
        );
        euint32 amount = FHE.asEuint32(baseAmount);
        // Multiply the encrypted base amount by the public trust score.
        // trustScore is public, amount stays encrypted — the weighted result is still private.
        euint32 weighted = FHE.mul(amount, FHE.asEuint32(uint32(trustScore)));
        FHE.allowThis(weighted);
        FHE.allow(weighted, operator);
        // Grant vault permission to operate on this ciphertext (required for FHE.add inside vault)
        FHE.allow(weighted, address(vault));
        vault.depositEncryptedReward(operator, weighted);
        emit WeightedRewardDistributed(operator, trustScore, block.timestamp);
    }
}
