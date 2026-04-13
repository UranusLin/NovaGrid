import hre, { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying PrivacyLeaderboard with:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const PrivacyLeaderboard = await ethers.getContractFactory("PrivacyLeaderboard");
  const leaderboard = await PrivacyLeaderboard.deploy();
  await leaderboard.waitForDeployment();
  const leaderboardAddress = await leaderboard.getAddress();

  console.log("\n✅ PrivacyLeaderboard deployed:");
  console.log("  Network:  ", hre.network.name);
  console.log("  Address:  ", leaderboardAddress);
  console.log("\nNext: update PRIVACY_LEADERBOARD_ADDRESS in apps/web-dashboard/src/lib/contracts.ts");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
