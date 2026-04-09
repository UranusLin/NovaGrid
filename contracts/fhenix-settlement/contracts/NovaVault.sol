// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title NovaVault
/// @notice Stores encrypted reward balances for DePIN node operators.
/// All balances are euint32 ciphertexts — only the operator can decrypt their own balance.
contract NovaVault is Ownable {
    // Operator address → encrypted pending balance
    mapping(address => euint32) private _encryptedBalances;
    // Operator address → encrypted lifetime earnings
    mapping(address => euint32) private _encryptedTotalEarned;

    address public distributor;

    event RewardDeposited(address indexed operator, uint256 timestamp);
    event RewardClaimed(address indexed operator, uint256 timestamp);
    event DistributorUpdated(address indexed oldDistributor, address indexed newDistributor);

    modifier onlyDistributor() {
        require(msg.sender == distributor, "NovaVault: caller is not distributor");
        _;
    }

    constructor(address _distributor) Ownable(msg.sender) {
        distributor = _distributor;
    }

    function setDistributor(address _distributor) external onlyOwner {
        emit DistributorUpdated(distributor, _distributor);
        distributor = _distributor;
    }

    /// @notice Deposit an encrypted reward for an operator.
    /// @dev Called by the distributor with a client-encrypted InEuint32.
    function depositReward(address operator, InEuint32 memory encryptedAmount) external onlyDistributor {
        euint32 amount = FHE.asEuint32(encryptedAmount);
        _addToBalance(operator, amount);
        emit RewardDeposited(operator, block.timestamp);
    }

    /// @notice Deposit a pre-computed encrypted reward (euint32) for an operator.
    /// @dev Called by RewardDistributor after applying trust-score weighting.
    function depositEncryptedReward(address operator, euint32 amount) external onlyDistributor {
        _addToBalance(operator, amount);
        emit RewardDeposited(operator, block.timestamp);
    }

    /// @notice Operator claims (subtracts) an encrypted amount from their balance.
    /// @dev The caller provides an InEuint32 representing the amount they wish to claim.
    function claimReward(InEuint32 memory encryptedClaimAmount) external {
        euint32 claimAmount = FHE.asEuint32(encryptedClaimAmount);
        _encryptedBalances[msg.sender] = FHE.sub(_encryptedBalances[msg.sender], claimAmount);
        FHE.allowThis(_encryptedBalances[msg.sender]);
        FHE.allow(_encryptedBalances[msg.sender], msg.sender);
        emit RewardClaimed(msg.sender, block.timestamp);
    }

    /// @notice Returns the encrypted balance handle for an operator.
    /// Only the operator or contract owner can call this.
    function getEncryptedBalance(address operator) external view returns (euint32) {
        require(msg.sender == operator || msg.sender == owner(), "NovaVault: not authorized");
        return _encryptedBalances[operator];
    }

    /// @notice Returns the encrypted lifetime earned handle for an operator.
    /// Only the operator or contract owner can call this.
    function getEncryptedTotalEarned(address operator) external view returns (euint32) {
        require(msg.sender == operator || msg.sender == owner(), "NovaVault: not authorized");
        return _encryptedTotalEarned[operator];
    }

    function _addToBalance(address operator, euint32 amount) private {
        FHE.allowThis(amount);
        // Initialize zero handles on first deposit — uninitialized euint32 (handle = 0)
        // cannot be used in FHE operations without a plaintext record in the task manager.
        if (euint32.unwrap(_encryptedBalances[operator]) == 0) {
            _encryptedBalances[operator] = FHE.asEuint32(0);
            FHE.allowThis(_encryptedBalances[operator]);
            FHE.allow(_encryptedBalances[operator], operator);
        }
        if (euint32.unwrap(_encryptedTotalEarned[operator]) == 0) {
            _encryptedTotalEarned[operator] = FHE.asEuint32(0);
            FHE.allowThis(_encryptedTotalEarned[operator]);
            FHE.allow(_encryptedTotalEarned[operator], operator);
        }
        _encryptedBalances[operator] = FHE.add(_encryptedBalances[operator], amount);
        _encryptedTotalEarned[operator] = FHE.add(_encryptedTotalEarned[operator], amount);
        FHE.allowThis(_encryptedBalances[operator]);
        FHE.allow(_encryptedBalances[operator], operator);
        FHE.allowThis(_encryptedTotalEarned[operator]);
        FHE.allow(_encryptedTotalEarned[operator], operator);
    }
}
