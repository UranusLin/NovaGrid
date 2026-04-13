import hre, { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying SealedBidAuction with:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // 10 minutes bidding window, 1 winning slot (adjustable)
  const durationSeconds = 10 * 60;
  const slots = 1;

  const SealedBidAuction = await ethers.getContractFactory("SealedBidAuction");
  const auction = await SealedBidAuction.deploy(durationSeconds, slots);
  await auction.waitForDeployment();
  const auctionAddress = await auction.getAddress();

  console.log("\n✅ SealedBidAuction deployed:");
  console.log("  Network:  ", hre.network.name);
  console.log("  Address:  ", auctionAddress);
  console.log("  Duration: ", durationSeconds, "seconds");
  console.log("  Slots:    ", slots);
  console.log("\nNext: update SEALED_BID_AUCTION_ADDRESS in apps/web-dashboard/src/lib/contracts.ts");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
