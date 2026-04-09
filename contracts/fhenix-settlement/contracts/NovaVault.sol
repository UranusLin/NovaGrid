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
    // Monotonic counter for withdraw request IDs
    uint256 private _withdrawNonce;

    address public distributor;

    event RewardDeposited(address indexed operator, uint256 timestamp);
    event RewardClaimed(address indexed operator, uint256 timestamp);
    event DistributorUpdated(address indexed oldDistributor, address indexed newDistributor);
    /// @notice Emitted when a withdraw is requested.
    /// @dev The encrypted amount handle is accessible to the operator via their CoFHE permit.
    ///      An off-chain relayer observes this event, decrypts the handle, and processes the payout.
    event WithdrawRequested(
        address indexed operator,
        bytes32 encryptedAmountHandle,
        uint256 requestId,
        uint256 timestamp
    );

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
    /// @dev FHE-native underflow guard: if balance < claimAmount, balance is left unchanged.
    ///      The guard is fully encrypted — no balance information is revealed on-chain.
    function claimReward(InEuint32 memory encryptedClaimAmount) external {
        require(euint32.unwrap(_encryptedBalances[msg.sender]) != 0, "NovaVault: no balance to claim");

        euint32 claimAmount = FHE.asEuint32(encryptedClaimAmount);
        FHE.allowThis(claimAmount);

        // Only subtract if balance >= claimAmount (encrypted comparison — reveals nothing)
        ebool sufficient = FHE.gte(_encryptedBalances[msg.sender], claimAmount);
        FHE.allowThis(sufficient);

        _encryptedBalances[msg.sender] = FHE.select(
            sufficient,
            FHE.sub(_encryptedBalances[msg.sender], claimAmount),
            _encryptedBalances[msg.sender]
        );
        FHE.allowThis(_encryptedBalances[msg.sender]);
        FHE.allow(_encryptedBalances[msg.sender], msg.sender);

        emit RewardClaimed(msg.sender, block.timestamp);
    }

    /// @notice Request a withdrawal of an encrypted amount from the pending balance.
    /// @dev Subtracts the amount (clamped to available balance) and emits WithdrawRequested.
    ///      An off-chain relayer observes the event, decrypts the handle via CoFHE permit,
    ///      and executes the actual token/ETH transfer to the operator.
    /// @return requestId Unique ID for this withdraw request (monotonically increasing)
    function requestWithdraw(InEuint32 memory encryptedWithdrawAmount) external returns (uint256 requestId) {
        require(euint32.unwrap(_encryptedBalances[msg.sender]) != 0, "NovaVault: no balance to withdraw");

        euint32 withdrawAmount = FHE.asEuint32(encryptedWithdrawAmount);
        FHE.allowThis(withdrawAmount);

        // Compute actual amount to withdraw (clamped to available balance)
        ebool sufficient = FHE.gte(_encryptedBalances[msg.sender], withdrawAmount);
        FHE.allowThis(sufficient);

        euint32 actualWithdraw = FHE.select(sufficient, withdrawAmount, _encryptedBalances[msg.sender]);
        FHE.allowThis(actualWithdraw);
        FHE.allow(actualWithdraw, msg.sender);

        // Compute new balance: 0 if draining everything, else balance - requested
        euint32 zero = FHE.asEuint32(0);
        FHE.allowThis(zero);
        _encryptedBalances[msg.sender] = FHE.select(
            sufficient,
            FHE.sub(_encryptedBalances[msg.sender], actualWithdraw),
            zero
        );
        FHE.allowThis(_encryptedBalances[msg.sender]);
        FHE.allow(_encryptedBalances[msg.sender], msg.sender);

        requestId = ++_withdrawNonce;
        emit WithdrawRequested(
            msg.sender,
            euint32.unwrap(actualWithdraw),
            requestId,
            block.timestamp
        );
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
