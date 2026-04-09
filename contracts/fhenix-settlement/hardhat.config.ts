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
  // eth-sepolia and arb-sepolia are auto-injected by @cofhe/hardhat-plugin.
  // We only define custom/override networks here.
  networks: {
    ...(PRIVATE_KEY
      ? {
          "eth-sepolia": {
            url: "https://rpc.sepolia.org",
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
          },
          "arb-sepolia": {
            url: "https://sepolia-rollup.arbitrum.io/rpc",
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
