import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@cofhe/hardhat-plugin";
import "dotenv/config";

const PRIVATE_KEY = process.env.EVM_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // eth-sepolia and arb-sepolia RPCs are auto-injected by @cofhe/hardhat-plugin.
  // We override only to add accounts and ensure the RPC matches the plugin default.
  networks: {
    ...(PRIVATE_KEY
      ? {
          "eth-sepolia": {
            url: process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia.publicnode.com",
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
          },
          "arb-sepolia": {
            url: process.env.ARBITRUM_SEPOLIA_RPC_URL ?? "https://sepolia-rollup.arbitrum.io/rpc",
            accounts: [PRIVATE_KEY],
            chainId: 421614,
          },
        }
      : {}),
  },
  cofhe: {
    logMocks: true,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};

export default config;
