// config.js
// Jubilee Protocol contract addresses and configuration

const { ethers } = require('ethers');

module.exports = {
  // Network configurations
  networks: {
    base: {
      name: 'Base Mainnet',
      chainId: 8453,
      rpcUrl: process.env.RPC_BASE || 'https://mainnet.base.org',
      contracts: {
        jUSDi: {
          vault: '0x26c39532C0dD06C0c4EddAeE36979626b16c77aC',
          asset: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' // USDC
        },
        jBTCi: {
          vault: '0x8a4C0254258F0D3dB7Bc5C5A43825Bb4EfC81337',
          asset: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' // cbBTC
        }
      }
    },
    baseSepolia: {
      name: 'Base Sepolia Testnet',
      chainId: 84532,
      rpcUrl: process.env.RPC_BASE_SEPOLIA || 'https://sepolia.base.org',
      contracts: {
        jUSDi: {
          vault: '0xc698e233fbB9810Ae0F22e154Ee0912Fa188C69c',
          asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // USDC
        }
      }
    },
    solana: {
      name: 'Solana Devnet',
      rpcUrl: process.env.RPC_SOLANA || 'https://api.devnet.solana.com',
      contracts: {
        jSOLi: {
          vault: 'Es3R4iMtdc3yHyKj9WxuK9imtSkDRw17816pRSbeVHsp'
        }
      }
    }
  },

  // 0x Swap API Configuration
  zeroEx: {
    baseUrl: 'https://api.0x.org/swap/permit2/quote',
    headers: {
      '0x-version': 'v2',
      ...(process.env.ZERO_EX_API_KEY && { '0x-api-key': process.env.ZERO_EX_API_KEY })
    }
  },

  // Asset addresses by network
  assets: {
    base: {
      ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Native ETH marker
      WETH: '0x4200000000000000000000000000000000000006',
      USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      cbBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
      WBTC: '0x', // Add if needed
      // Vault shares (usually don't swap these directly, swap underlying assets)
      jUSDi: '0x26c39532C0dD06C0c4EddAeE36979626b16c77aC',
      jBTCi: '0x8a4C0254258F0D3dB7Bc5C5A43825Bb4EfC81337'
    },
    baseSepolia: {
      ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      WETH: '0x4200000000000000000000000000000000000006',
      USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
    }
  },

  // ERC-4626 Vault ABI
  vaultABI: [
    'function totalAssets() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function convertToAssets(uint256) view returns (uint256)',
    'function convertToShares(uint256) view returns (uint256)',
    'function asset() view returns (address)',
    'function deposit(uint256, address) returns (uint256)',
    'function withdraw(uint256, address, address) returns (uint256)',
    'function managedBalanceOf(address) view returns (uint256)'
  ],

  // ERC-20 Token ABI
  tokenABI: [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)',
    'function allowance(address, address) view returns (uint256)',
    'function approve(address, uint256) returns (bool)',
    'function transfer(address, uint256) returns (bool)'
  ]
};
