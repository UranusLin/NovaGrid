// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SealedBidAuction
/// @notice Sealed-bid auction for DePIN network slots.
/// Operators bid encrypted amounts. After the auction ends the owner calls
/// finalizeAuction() which uses FHE.gt + FHE.select to find the encrypted
/// maximum bid. Each bidder then calls checkWinStatus() — FHE.eq compares
/// their bid against the max — and decrypts the result via a CoFHE permit:
/// 1 = winner, 0 = not a winner. Losing bid amounts are never revealed.
///
/// New FHE operations vs previous contracts:
///   FHE.gt  — encrypted greater-than comparison (finds highest bid)
///   FHE.eq  — encrypted equality check (each bidder checks if they won)
///   FHE.and — would combine ebool flags (available; gt+eq covers the demo)
contract SealedBidAuction is Ownable {
    // ── Storage ───────────────────────────────────────────────────────────────

    /// Auction end timestamp (owner can call endEarly() for demo purposes)
    uint256 public auctionEnd;

    /// Number of winning slots available
    uint256 public availableSlots;

    /// Whether finalizeAuction() has been called
    bool public finalized;

    /// Encrypted maximum bid (set by finalizeAuction)
    euint32 private _maxBid;

    /// bidder -> encrypted bid (only bidder + this contract can operate on it)
    mapping(address => euint32) private _bids;

    /// bidder -> encrypted win status (1=winner, 0=not; set by checkWinStatus)
    mapping(address => euint32) private _winStatus;

    /// enrollment guards
    mapping(address => bool) private _hasBid;
    mapping(address => bool) private _hasWinStatus;

    /// ordered list of bidder addresses (public — bid amounts are private)
    address[] private _bidders;

    uint256 public constant MAX_BIDDERS = 50;

    // ── Events ────────────────────────────────────────────────────────────────

    event BidSubmitted(address indexed bidder, uint256 timestamp);
    event AuctionFinalized(uint256 bidderCount, uint256 timestamp);
    event WinStatusChecked(address indexed bidder, uint256 timestamp);

    // ── Constructor ───────────────────────────────────────────────────────────

    /// @param durationSeconds How long the bidding window stays open
    /// @param slots Number of winning slots available
    constructor(uint256 durationSeconds, uint256 slots) Ownable(msg.sender) {
        auctionEnd = block.timestamp + durationSeconds;
        availableSlots = slots;
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    /// @notice Submit or update your encrypted bid.
    /// @dev Use Encryptable.uint32(BigInt(amount)) from the cofhe SDK on the client.
    ///      Calling again before the auction ends overwrites the previous bid.
    function submitBid(InEuint32 memory encryptedBid) external {
        require(block.timestamp < auctionEnd, "SealedBidAuction: bidding closed");
        require(!finalized, "SealedBidAuction: auction finalized");
        require(_bidders.length < MAX_BIDDERS, "SealedBidAuction: max bidders reached");

        euint32 bid = FHE.asEuint32(encryptedBid);
        FHE.allowThis(bid);
        FHE.allow(bid, msg.sender);

        _bids[msg.sender] = bid;

        if (!_hasBid[msg.sender]) {
            _bidders.push(msg.sender);
            _hasBid[msg.sender] = true;
        }

        emit BidSubmitted(msg.sender, block.timestamp);
    }

    /// @notice Owner closes the bidding window early (useful for demos).
    function endEarly() external onlyOwner {
        require(!finalized, "SealedBidAuction: already finalized");
        auctionEnd = block.timestamp;
    }

    /// @notice Owner finalizes: finds the encrypted maximum bid.
    /// @dev Iterates all bids using FHE.gt (new operation) + FHE.select to
    ///      track the running encrypted maximum. No plaintext is ever revealed.
    ///      The encrypted max is stored for use by checkWinStatus().
    function finalizeAuction() external onlyOwner {
        require(block.timestamp >= auctionEnd, "SealedBidAuction: auction not ended");
        require(!finalized, "SealedBidAuction: already finalized");
        require(_bidders.length > 0, "SealedBidAuction: no bids");

        // Start with the first bid as current encrypted maximum
        euint32 maxBid = _bids[_bidders[0]];
        FHE.allowThis(maxBid);

        // Iterate remaining bids: update max using FHE.gt + FHE.select
        uint256 len = _bidders.length;
        for (uint256 i = 1; i < len; i++) {
            euint32 current = _bids[_bidders[i]];

            // Is current bid greater than the running max? (FHE.gt — new op)
            ebool isGreater = FHE.gt(current, maxBid);
            FHE.allowThis(isGreater);

            // Update max: keep current if it's greater, else keep existing max
            maxBid = FHE.select(isGreater, current, maxBid);
            FHE.allowThis(maxBid);
        }

        _maxBid = maxBid;
        finalized = true;

        emit AuctionFinalized(len, block.timestamp);
    }

    /// @notice Each bidder checks privately whether they won.
    /// @dev Uses FHE.eq (new operation) to compare the caller's encrypted bid
    ///      against the encrypted maximum. Produces an encrypted euint32:
    ///      1 = bid equals the max (winner), 0 = did not win.
    ///      Decrypt the result via a CoFHE permit — only you see your outcome.
    ///      Losing bid amounts are never revealed on-chain.
    function checkWinStatus() external {
        require(finalized, "SealedBidAuction: not finalized yet");
        require(_hasBid[msg.sender], "SealedBidAuction: no bid submitted");

        // FHE.eq: did I bid exactly the maximum? (encrypted equality — new op)
        ebool isWinner = FHE.eq(_bids[msg.sender], _maxBid);
        FHE.allowThis(isWinner);

        // Convert ebool to euint32: 1 if winner, 0 if not (for permit decryption)
        euint32 one = FHE.asEuint32(1);
        euint32 zero = FHE.asEuint32(0);
        FHE.allowThis(one);
        FHE.allowThis(zero);

        euint32 result = FHE.select(isWinner, one, zero);
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);

        _winStatus[msg.sender] = result;
        _hasWinStatus[msg.sender] = true;

        emit WinStatusChecked(msg.sender, block.timestamp);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    /// @notice Returns the stored encrypted win status for permit-based decryption.
    /// @dev Call checkWinStatus() first, then read and decrypt this value via permit.
    function getWinStatus(address bidder) external view returns (euint32) {
        require(
            msg.sender == bidder || msg.sender == owner(),
            "SealedBidAuction: not authorized"
        );
        require(_hasWinStatus[bidder], "SealedBidAuction: win status not computed");
        return _winStatus[bidder];
    }

    /// @notice Returns the caller's encrypted bid for permit-based decryption.
    function getMyBid(address bidder) external view returns (euint32) {
        require(
            msg.sender == bidder || msg.sender == owner(),
            "SealedBidAuction: not authorized"
        );
        require(_hasBid[bidder], "SealedBidAuction: no bid found");
        return _bids[bidder];
    }

    /// @notice Whether a bidder's win status has been computed.
    function hasWinStatus(address bidder) external view returns (bool) {
        return _hasWinStatus[bidder];
    }

    /// @notice Whether an address has submitted a bid.
    function hasBid(address bidder) external view returns (bool) {
        return _hasBid[bidder];
    }

    /// @notice Total number of bids submitted.
    function bidderCount() external view returns (uint256) {
        return _bidders.length;
    }

    /// @notice Whether the bidding window is currently open.
    function isActive() external view returns (bool) {
        return block.timestamp < auctionEnd && !finalized;
    }

    /// @notice All bidder addresses (public — bid amounts remain private).
    function getBidders() external view returns (address[] memory) {
        return _bidders;
    }
}
