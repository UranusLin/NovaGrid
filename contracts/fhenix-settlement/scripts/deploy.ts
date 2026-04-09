import hre, { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy NovaVault — initially set deployer as distributor,
  // then update to RewardDistributor after it is deployed.
  const NovaVault = await ethers.getContractFactory("NovaVault");
  const vault = await NovaVault.deploy(deployer.address);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("NovaVault deployed to:", vaultAddress);

  // Deploy RewardDistributor, pointing at NovaVault
  const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
  const distributor = await RewardDistributor.deploy(vaultAddress);
  await distributor.waitForDeployment();
  const distributorAddress = await distributor.getAddress();
  console.log("RewardDistributor deployed to:", distributorAddress);

  // Update NovaVault distributor to RewardDistributor
  const tx = await vault.setDistributor(distributorAddress);
  await tx.wait();
  console.log("NovaVault distributor set to RewardDistributor");

  console.log("\nDeployment complete:");
  console.log("  Network:            ", hre.network.name);
  console.log("  NovaVault:          ", vaultAddress);
  console.log("  RewardDistributor:  ", distributorAddress);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
