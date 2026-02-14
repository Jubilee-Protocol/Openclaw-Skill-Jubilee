// Jubilee Protocol Contract Configuration
// Updated: February 13, 2026

module.exports = {
  networks: {
    base: {
      chainId: 8453,
      rpc: process.env.RPC_BASE || "https://mainnet.base.org",
      contracts: {
        jUSDi: {
          vault: "0x26c39532C0dD06C0c4EddAeE36979626b16c77aC",
          token: "0x04cC650F6dB0B91Ef910a4a54F22232771988432"
        },
        jBTCi: {
          vault: "0x8a4C0254258F0D3dB7Bc5C5A43825Bb4EfC81337",
          token: "0x8a4C0254258F0D3dB7Bc5C5A43825Bb4EfC81337" // Same as vault per ERC4626
        }
      }
    },
    baseSepolia: {
      chainId: 84532,
      rpc: process.env.RPC_BASE_SEPOLIA || "https://sepolia.base.org",
      contracts: {
        jUSDi: {
          vault: "0xc698e233fbB9810Ae0F22e154Ee0912Fa188C69c",
          token: "0x04cC650F6dB0B91Ef910a4a54F22232771988432"
        }
      }
    },
    solana: {
      rpc: process.env.RPC_SOLANA || "https://api.mainnet-beta.solana.com",
      contracts: {
        jSOLi: {
          vault: "Es3R4iMtdc3yHyKj9WxuK9imtSkDRw17816pRSbeVHsp"
        }
      }
    }
  },

  // Minimal ABI for ERC4626 Vault Operations
  vaultABI: [
    "function totalAssets() view returns (uint256)",
    "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
    "function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)",
    "function balanceOf(address account) view returns (uint256)",
    "function convertToAssets(uint256 shares) view returns (uint256)",
    "function asset() view returns (address)",
    "function managedBalanceOf(address asset) view returns (uint256)",
    "event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)",
    "event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)"
  ],

  // ERC20 Token ABI
  tokenABI: [
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ],

  // Asset addresses on Base
  assets: {
    base: {
      USDC: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
      cbBTC: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf"
    }
  }
};
