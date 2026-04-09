import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { mock_expectPlaintext } from "@cofhe/hardhat-plugin";
import { Encryptable } from "@cofhe/sdk";

describe("NovaVault + RewardDistributor", function () {
  async function deployFixture() {
    const [owner, operator, other] = await ethers.getSigners();

    const NovaVault = await ethers.getContractFactory("NovaVault");
    const vault = await NovaVault.deploy(owner.address);
    await vault.waitForDeployment();

    const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
    const distributor = await RewardDistributor.deploy(await vault.getAddress());
    await distributor.waitForDeployment();

    await vault.setDistributor(await distributor.getAddress());

    return { vault, distributor, owner, operator, other };
  }

  // ─── Deployment ─────────────────────────────────────────────────────────────

  it("deploys with correct initial state", async function () {
    const { vault, distributor, owner } = await deployFixture();
    expect(await vault.owner()).to.equal(owner.address);
    expect(await vault.distributor()).to.equal(await distributor.getAddress());
    expect(await distributor.owner()).to.equal(owner.address);
  });

  it("only distributor can call depositReward", async function () {
    const { vault, owner, operator } = await deployFixture();

    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);
    const [encryptedAmount] = await ownerClient
      .encryptInputs([Encryptable.uint32(100)])
      .execute();

    await expect(
      vault.connect(owner).depositReward(operator.address, encryptedAmount)
    ).to.be.revertedWith("NovaVault: caller is not distributor");
  });

  // ─── Weighted distribution ───────────────────────────────────────────────────

  it("distributeWeightedReward deposits trust-score-weighted amount", async function () {
    const { vault, distributor, owner, operator } = await deployFixture();

    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);
    const [encryptedAmount] = await ownerClient
      .encryptInputs([Encryptable.uint32(10)])
      .execute();

    // trustScore = 80 → weighted = 10 * 80 = 800
    await distributor.connect(owner).distributeWeightedReward(
      operator.address,
      encryptedAmount,
      80n
    );

    const balanceHandle = await vault.connect(operator).getEncryptedBalance(operator.address);
    await mock_expectPlaintext(ethers.provider, balanceHandle, 800n);
  });

  it("trustScore below 40 reverts", async function () {
    const { distributor, owner, operator } = await deployFixture();

    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);
    const [encrypted] = await ownerClient
      .encryptInputs([Encryptable.uint32(10)])
      .execute();

    await expect(
      distributor.connect(owner).distributeWeightedReward(operator.address, encrypted, 39n)
    ).to.be.revertedWith("RewardDistributor: trustScore out of range [40,100]");
  });

  it("trustScore above 100 reverts", async function () {
    const { distributor, owner, operator } = await deployFixture();

    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);
    const [encrypted] = await ownerClient
      .encryptInputs([Encryptable.uint32(10)])
      .execute();

    await expect(
      distributor.connect(owner).distributeWeightedReward(operator.address, encrypted, 101n)
    ).to.be.revertedWith("RewardDistributor: trustScore out of range [40,100]");
  });

  // ─── Batch distribution (#13) ────────────────────────────────────────────────

  it("distributeWeightedRewardBatch credits all operators correctly", async function () {
    const [owner, op1, op2] = await ethers.getSigners();

    const NovaVault = await ethers.getContractFactory("NovaVault");
    const vault = await NovaVault.deploy(owner.address);
    await vault.waitForDeployment();

    const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
    const distributor = await RewardDistributor.deploy(await vault.getAddress());
    await distributor.waitForDeployment();
    await vault.setDistributor(await distributor.getAddress());

    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);
    // base = 5 for both; op1 score = 60 → 300, op2 score = 100 → 500
    const [enc1, enc2] = await ownerClient
      .encryptInputs([Encryptable.uint32(5), Encryptable.uint32(5)])
      .execute();

    await distributor.connect(owner).distributeWeightedRewardBatch(
      [op1.address, op2.address],
      [enc1, enc2],
      [60n, 100n]
    );

    const h1 = await vault.connect(op1).getEncryptedBalance(op1.address);
    const h2 = await vault.connect(op2).getEncryptedBalance(op2.address);
    await mock_expectPlaintext(ethers.provider, h1, 300n);
    await mock_expectPlaintext(ethers.provider, h2, 500n);
  });

  it("batch reverts on length mismatch", async function () {
    const { distributor, owner, operator, other } = await deployFixture();

    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);
    const [enc] = await ownerClient.encryptInputs([Encryptable.uint32(5)]).execute();

    await expect(
      distributor.connect(owner).distributeWeightedRewardBatch(
        [operator.address, other.address],
        [enc],         // only 1 amount for 2 operators
        [60n, 80n]
      )
    ).to.be.revertedWith("RewardDistributor: length mismatch");
  });

  // ─── Claim with underflow guard (#3) ─────────────────────────────────────────

  it("claimReward reduces encrypted balance", async function () {
    const { vault, distributor, owner, operator } = await deployFixture();

    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);
    const [depositEncrypted] = await ownerClient
      .encryptInputs([Encryptable.uint32(10)])
      .execute();
    // Deposit: 10 * 100 = 1000
    await distributor.connect(owner).distributeWeightedReward(
      operator.address,
      depositEncrypted,
      100n
    );

    const operatorClient = await hre.cofhe.createClientWithBatteries(operator);
    const [claimEncrypted] = await operatorClient
      .encryptInputs([Encryptable.uint32(200)])
      .execute();
    await vault.connect(operator).claimReward(claimEncrypted);

    const balanceHandle = await vault.connect(operator).getEncryptedBalance(operator.address);
    await mock_expectPlaintext(ethers.provider, balanceHandle, 800n);
  });

  it("claimReward underflow guard: balance unchanged when claim > balance", async function () {
    const { vault, distributor, owner, operator } = await deployFixture();

    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);
    const [depositEncrypted] = await ownerClient
      .encryptInputs([Encryptable.uint32(10)])
      .execute();
    // Deposit: 10 * 40 = 400
    await distributor.connect(owner).distributeWeightedReward(
      operator.address,
      depositEncrypted,
      40n
    );

    const operatorClient = await hre.cofhe.createClientWithBatteries(operator);
    // Attempt to claim 1000 when balance is only 400
    const [claimEncrypted] = await operatorClient
      .encryptInputs([Encryptable.uint32(1000)])
      .execute();
    await vault.connect(operator).claimReward(claimEncrypted);

    // Balance should remain at 400 (no underflow)
    const balanceHandle = await vault.connect(operator).getEncryptedBalance(operator.address);
    await mock_expectPlaintext(ethers.provider, balanceHandle, 400n);
  });

  it("claimReward reverts when no balance exists", async function () {
    const { vault, operator } = await deployFixture();
    const operatorClient = await hre.cofhe.createClientWithBatteries(operator);
    const [claimEncrypted] = await operatorClient
      .encryptInputs([Encryptable.uint32(100)])
      .execute();
    await expect(
      vault.connect(operator).claimReward(claimEncrypted)
    ).to.be.revertedWith("NovaVault: no balance to claim");
  });

  // ─── Withdraw request (#11) ──────────────────────────────────────────────────

  it("requestWithdraw reduces balance and emits WithdrawRequested", async function () {
    const { vault, distributor, owner, operator } = await deployFixture();

    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);
    const [depositEncrypted] = await ownerClient
      .encryptInputs([Encryptable.uint32(10)])
      .execute();
    // Deposit: 10 * 80 = 800
    await distributor.connect(owner).distributeWeightedReward(
      operator.address,
      depositEncrypted,
      80n
    );

    const operatorClient = await hre.cofhe.createClientWithBatteries(operator);
    const [withdrawEncrypted] = await operatorClient
      .encryptInputs([Encryptable.uint32(300)])
      .execute();

    const tx = await vault.connect(operator).requestWithdraw(withdrawEncrypted);
    const receipt = await tx.wait();

    // WithdrawRequested event should be emitted with requestId = 1
    const event = receipt?.logs.find((log: any) => {
      try {
        const parsed = vault.interface.parseLog(log);
        return parsed?.name === "WithdrawRequested";
      } catch { return false; }
    });
    expect(event).to.not.be.undefined;

    // Balance should be 800 - 300 = 500
    const balanceHandle = await vault.connect(operator).getEncryptedBalance(operator.address);
    await mock_expectPlaintext(ethers.provider, balanceHandle, 500n);
  });

  it("requestWithdraw clamps to balance when withdraw > balance", async function () {
    const { vault, distributor, owner, operator } = await deployFixture();

    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);
    const [depositEncrypted] = await ownerClient
      .encryptInputs([Encryptable.uint32(10)])
      .execute();
    // Deposit: 10 * 50 = 500
    await distributor.connect(owner).distributeWeightedReward(
      operator.address,
      depositEncrypted,
      50n
    );

    const operatorClient = await hre.cofhe.createClientWithBatteries(operator);
    // Attempt to withdraw 9999, should drain the full 500
    const [withdrawEncrypted] = await operatorClient
      .encryptInputs([Encryptable.uint32(9999)])
      .execute();
    await vault.connect(operator).requestWithdraw(withdrawEncrypted);

    // Balance should be 0 (clamped drain)
    const balanceHandle = await vault.connect(operator).getEncryptedBalance(operator.address);
    await mock_expectPlaintext(ethers.provider, balanceHandle, 0n);
  });

  // ─── Access control ───────────────────────────────────────────────────────────

  it("getEncryptedBalance reverts for unauthorized caller", async function () {
    const { vault, operator, other } = await deployFixture();
    await expect(
      vault.connect(other).getEncryptedBalance(operator.address)
    ).to.be.revertedWith("NovaVault: not authorized");
  });

  it("setDistributor is owner-only", async function () {
    const { vault, other } = await deployFixture();
    await expect(vault.connect(other).setDistributor(other.address)).to.be.reverted;
  });

  // ─── E2E: ZK trust score → weighted deposit → claim (#10) ────────────────────

  it("E2E: ZK-score-weighted deposit then claim flows correctly", async function () {
    const { vault, distributor, owner, operator } = await deployFixture();

    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);

    // Step 1: Simulate Aleo compute_node_score output
    //   uptime=95%, hashrate_score=80 → score = 40 + 28 + 24 = 92
    const zkTrustScore = 92n;
    const baseUnit = 5; // base amount per score point

    const [depositEncrypted] = await ownerClient
      .encryptInputs([Encryptable.uint32(baseUnit)])
      .execute();

    // Step 2: Distribute weighted reward using public ZK trust score
    // weighted = 5 * 92 = 460
    await distributor.connect(owner).distributeWeightedReward(
      operator.address,
      depositEncrypted,
      zkTrustScore
    );

    // Verify deposit
    const balanceAfterDeposit = await vault.connect(operator).getEncryptedBalance(operator.address);
    await mock_expectPlaintext(ethers.provider, balanceAfterDeposit, 460n);

    const totalEarnedHandle = await vault.connect(operator).getEncryptedTotalEarned(operator.address);
    await mock_expectPlaintext(ethers.provider, totalEarnedHandle, 460n);

    // Step 3: Operator claims partial amount
    const operatorClient = await hre.cofhe.createClientWithBatteries(operator);
    const [claimEncrypted] = await operatorClient
      .encryptInputs([Encryptable.uint32(100)])
      .execute();
    await vault.connect(operator).claimReward(claimEncrypted);

    // Balance: 460 - 100 = 360
    const balanceAfterClaim = await vault.connect(operator).getEncryptedBalance(operator.address);
    await mock_expectPlaintext(ethers.provider, balanceAfterClaim, 360n);

    // Total earned unchanged (claim doesn't reduce total earned)
    const totalEarnedAfterClaim = await vault.connect(operator).getEncryptedTotalEarned(operator.address);
    await mock_expectPlaintext(ethers.provider, totalEarnedAfterClaim, 460n);

    // Step 4: Request withdraw of remaining balance
    const [withdrawEncrypted] = await operatorClient
      .encryptInputs([Encryptable.uint32(360)])
      .execute();
    await vault.connect(operator).requestWithdraw(withdrawEncrypted);

    // Balance zeroed out
    const balanceAfterWithdraw = await vault.connect(operator).getEncryptedBalance(operator.address);
    await mock_expectPlaintext(ethers.provider, balanceAfterWithdraw, 0n);
  });
});
