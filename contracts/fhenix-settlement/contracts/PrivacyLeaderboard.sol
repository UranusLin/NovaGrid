// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PrivacyLeaderboard
/// @notice Encrypted performance score leaderboard for DePIN node operators.
///
/// Nodes submit their encrypted composite score (derived from the Aleo ZK trust score).
/// Any enrolled node can compute their rank — the encrypted count of nodes scoring
/// strictly below them — decryptable only by the requesting node via a CoFHE permit.
///
/// FHE operations introduced here (vs NovaVault / RewardDistributor):
///   FHE.lt      — encrypted less-than comparison, returns ebool
///   FHE.select  — encrypted conditional on ebool (already in NovaVault, new context here)
///   ebool storage — encrypted booleans are used as per-node vote accumulators
///
/// Privacy guarantee:
///   - Individual scores are never revealed on-chain or to other nodes
///   - The rank result is an encrypted ciphertext; only the requesting node can decrypt it
///   - Node addresses are public (identity), scores and ranks are private (content)
contract PrivacyLeaderboard is Ownable {
    // ── Storage ───────────────────────────────────────────────────────────────

    /// node → encrypted performance score (only node + this contract can operate on it)
    mapping(address => euint32) private _scores;

    /// node → encrypted rank (set by computeMyRank; only node can decrypt via permit)
    mapping(address => euint32) private _ranks;

    /// node → whether a rank has been computed at least once
    mapping(address => bool) private _hasRank;

    /// ordered list of enrolled node addresses (identity is public, scores are not)
    address[] private _nodes;

    /// enrollment guard
    mapping(address => bool) private _enrolled;

    /// Gas guard: rank computation iterates all nodes; cap keeps it feasible on-chain
    uint256 public constant MAX_NODES = 100;

    // ── Events ────────────────────────────────────────────────────────────────

    event ScoreSubmitted(address indexed node, uint256 timestamp);
    event RankComputed(address indexed node, uint256 nodeCount, uint256 timestamp);

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ── Write ─────────────────────────────────────────────────────────────────

    /// @notice Submit or update your encrypted performance score.
    /// @dev The score is typically the Aleo ZK trust score (0-100), but any
    ///      uint32 value is accepted. Calling again overwrites the previous score.
    ///      Use Encryptable.uint32(BigInt(score)) from the cofhe SDK on the client.
    /// @param encryptedScore Client-encrypted score
    function submitScore(InEuint32 memory encryptedScore) external {
        euint32 score = FHE.asEuint32(encryptedScore);
        FHE.allowThis(score);         // contract needs ACL access for rank comparisons
        FHE.allow(score, msg.sender); // node can decrypt their own score via permit

        _scores[msg.sender] = score;

        if (!_enrolled[msg.sender]) {
            require(_nodes.length < MAX_NODES, "PrivacyLeaderboard: network full");
            _nodes.push(msg.sender);
            _enrolled[msg.sender] = true;
        }

        emit ScoreSubmitted(msg.sender, block.timestamp);
    }

    /// @notice Compute how many other nodes score strictly below you.
    /// @dev Iterates every enrolled node, performs an FHE.lt comparison per node,
    ///      and accumulates an encrypted vote counter (0 or 1 per node).
    ///      The resulting encrypted count is stored and ACL-permitted to msg.sender.
    ///
    ///      To read the result, call getMyRank(address) after this tx confirms,
    ///      then decrypt via a CoFHE permit in the browser.
    ///
    ///      Example: if 7 out of 20 nodes score lower than you, rank = 7.
    ///      Divide by nodeCount() to derive a percentile — no individual scores exposed.
    function computeMyRank() external {
        require(
            _enrolled[msg.sender],
            "PrivacyLeaderboard: not enrolled, call submitScore first"
        );

        euint32 myScore = _scores[msg.sender];

        // Accumulator: encrypted count of nodes scoring below me
        euint32 count = FHE.asEuint32(0);
        FHE.allowThis(count);

        uint256 len = _nodes.length;
        for (uint256 i = 0; i < len; i++) {
            address other = _nodes[i];
            if (other == msg.sender) continue;

            // FHE.lt: is other's score strictly less than mine? → encrypted bool
            ebool lowerThanMe = FHE.lt(_scores[other], myScore);
            FHE.allowThis(lowerThanMe);

            // Convert ebool vote to euint32: 1 if lower, 0 otherwise
            euint32 one = FHE.asEuint32(1);
            euint32 zero = FHE.asEuint32(0);
            FHE.allowThis(one);
            FHE.allowThis(zero);

            euint32 vote = FHE.select(lowerThanMe, one, zero);
            FHE.allowThis(vote);

            // Accumulate
            count = FHE.add(count, vote);
            FHE.allowThis(count);
        }

        // Store result and grant ACL to requester for permit-based decryption
        FHE.allow(count, msg.sender);
        _ranks[msg.sender] = count;
        _hasRank[msg.sender] = true;

        emit RankComputed(msg.sender, len, block.timestamp);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    /// @notice Returns the stored encrypted rank for a node.
    /// @dev Only the node itself or the contract owner can call this.
    ///      Use with a CoFHE permit on the client to decrypt the value.
    function getMyRank(address node) external view returns (euint32) {
        require(
            msg.sender == node || msg.sender == owner(),
            "PrivacyLeaderboard: not authorized"
        );
        require(_hasRank[node], "PrivacyLeaderboard: no rank computed yet");
        return _ranks[node];
    }

    /// @notice Whether the node has a computed rank available to decrypt.
    function hasRank(address node) external view returns (bool) {
        return _hasRank[node];
    }

    /// @notice Whether a node has submitted a score.
    function isEnrolled(address node) external view returns (bool) {
        return _enrolled[node];
    }

    /// @notice Total number of nodes enrolled in the leaderboard.
    function nodeCount() external view returns (uint256) {
        return _nodes.length;
    }

    /// @notice All enrolled node addresses (public — scores and ranks remain private).
    function getNodes() external view returns (address[] memory) {
        return _nodes;
    }
}
