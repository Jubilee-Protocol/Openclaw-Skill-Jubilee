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
    ethereum: {
      name: 'Ethereum Mainnet',
      chainId: 1,
      rpcUrl: process.env.RPC_ETHEREUM || 'https://eth.llamarpc.com',
      contracts: {}
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

  // Uniswap Protocol Configuration
  uniswap: {
    swapRouter02: {
      ethereum: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      base: '0x2626664c2603336E57B271c5C0b26F421741e481'
    },
    quoterV2: {
      ethereum: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
      base: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a'
    },
    permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3'
  },

  // Jupiter API Configuration (Solana)
  jupiter: {
    baseUrl: 'https://api.jup.ag',
    // Well-known Solana token mints
    mints: {
      SOL: 'So11111111111111111111111111111111111111112',
      USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
      JITOSOL: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
      BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
    }
  },

  // Lightning Network Configuration (Bitcoin)
  lightning: {
    lndRestHost: process.env.LND_REST_HOST || 'https://localhost:8080',
    macaroonPath: process.env.LND_MACAROON_PATH || '~/.lnd/data/chain/bitcoin/mainnet/admin.macaroon',
    tlsCertPath: process.env.LND_TLS_CERT_PATH || '~/.lnd/tls.cert'
  },

  // Asset addresses by network
  assets: {
    base: {
      ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Native ETH marker
      WETH: '0x4200000000000000000000000000000000000006',
      USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      cbBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
      DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      WBTC: '0x', // Add if needed
      // Vault shares (usually don't swap these directly, swap underlying assets)
      jUSDi: '0x26c39532C0dD06C0c4EddAeE36979626b16c77aC',
      jBTCi: '0x8a4C0254258F0D3dB7Bc5C5A43825Bb4EfC81337'
    },
    ethereum: {
      ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
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
