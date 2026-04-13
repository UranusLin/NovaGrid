import hre, { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // ── NovaVault ──────────────────────────────────────────────────────────────
  // Deploy with deployer as temporary distributor; updated after RewardDistributor deploys.
  const NovaVault = await ethers.getContractFactory("NovaVault");
  const vault = await NovaVault.deploy(deployer.address);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("NovaVault deployed to:", vaultAddress);

  // ── RewardDistributor ──────────────────────────────────────────────────────
  const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
  const distributor = await RewardDistributor.deploy(vaultAddress);
  await distributor.waitForDeployment();
  const distributorAddress = await distributor.getAddress();
  console.log("RewardDistributor deployed to:", distributorAddress);

  // Wire up: set vault's distributor to RewardDistributor
  const tx = await vault.setDistributor(distributorAddress);
  await tx.wait();
  console.log("NovaVault distributor updated to RewardDistributor");

  // ── PrivacyLeaderboard ─────────────────────────────────────────────────────
  // Standalone — no constructor args needed.
  const PrivacyLeaderboard = await ethers.getContractFactory("PrivacyLeaderboard");
  const leaderboard = await PrivacyLeaderboard.deploy();
  await leaderboard.waitForDeployment();
  const leaderboardAddress = await leaderboard.getAddress();
  console.log("PrivacyLeaderboard deployed to:", leaderboardAddress);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n✅ Deployment complete:");
  console.log("  Network:              ", hre.network.name);
  console.log("  NovaVault:            ", vaultAddress);
  console.log("  RewardDistributor:    ", distributorAddress);
  console.log("  PrivacyLeaderboard:   ", leaderboardAddress);
  console.log("\nUpdate contracts.ts with the PrivacyLeaderboard address above.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
