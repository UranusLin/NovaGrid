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

    // owner is no longer the distributor (RewardDistributor is), should revert
    await expect(
      vault.connect(owner).depositReward(operator.address, encryptedAmount)
    ).to.be.revertedWith("NovaVault: caller is not distributor");
  });

  it("distributeWeightedReward deposits trust-score-weighted amount", async function () {
    const { vault, distributor, owner, operator } = await deployFixture();

    // Encrypt base amount of 10 (per-score-point unit)
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

  it("claimReward reduces encrypted balance", async function () {
    const { vault, distributor, owner, operator } = await deployFixture();

    // Deposit: 10 * 100 = 1000
    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);
    const [depositEncrypted] = await ownerClient
      .encryptInputs([Encryptable.uint32(10)])
      .execute();
    await distributor.connect(owner).distributeWeightedReward(
      operator.address,
      depositEncrypted,
      100n
    );

    // Operator claims 200
    const operatorClient = await hre.cofhe.createClientWithBatteries(operator);
    const [claimEncrypted] = await operatorClient
      .encryptInputs([Encryptable.uint32(200)])
      .execute();
    await vault.connect(operator).claimReward(claimEncrypted);

    // Remaining balance: 1000 - 200 = 800
    const balanceHandle = await vault.connect(operator).getEncryptedBalance(operator.address);
    await mock_expectPlaintext(ethers.provider, balanceHandle, 800n);
  });

  it("getEncryptedBalance reverts for unauthorized caller", async function () {
    const { vault, operator, other } = await deployFixture();
    await expect(
      vault.connect(other).getEncryptedBalance(operator.address)
    ).to.be.revertedWith("NovaVault: not authorized");
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

  it("setDistributor is owner-only", async function () {
    const { vault, other } = await deployFixture();
    await expect(vault.connect(other).setDistributor(other.address)).to.be.reverted;
  });
});
