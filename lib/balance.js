#!/usr/bin/env node
// lib/balance.js
// Check agent's treasury balance across all Jubilee vaults

require('dotenv').config();
const { ethers } = require('ethers');
const chalk = require('chalk');
const config = require('../config');
const { loadWallet, getProvider, formatAmount, handleError } = require('./utils');

async function getBalance(chain = 'base') {
  try {
    console.log(chalk.bold.blue(`\n💰 Treasury Balance - ${chain.toUpperCase()}`));
    console.log(chalk.gray('='.repeat(60)));
    
    const wallet = loadWallet();
    const provider = getProvider(chain, config);
    const connectedWallet = wallet.connect(provider);
    const network = config.networks[chain];
    
    console.log(chalk.gray('Agent Address:'), chalk.cyan(wallet.address));
    
    // Check ETH balance for gas
    const ethBalance = await provider.getBalance(wallet.address);
    console.log(chalk.gray('\nGas Balance:'), chalk.cyan(`${formatAmount(ethBalance, 18)} ETH`));
    
    let totalValueUSD = 0;
    
    // Check jUSDi holdings
    if (network.contracts.jUSDi) {
      const balance = await getVaultBalance(
        'jUSDi',
        network.contracts.jUSDi.vault,
        wallet.address,
        provider
      );
      totalValueUSD += balance;
    }
    
    // Check jBTCi holdings
    if (network.contracts.jBTCi) {
      const balance = await getVaultBalance(
        'jBTCi',
        network.contracts.jBTCi.vault,
        wallet.address,
        provider
      );
      // Would need BTC price oracle for USD value
      console.log(chalk.gray('  ├─ USD Value:'), chalk.yellow('(Requires BTC price oracle)'));
    }
    
    console.log(chalk.gray('\n' + '='.repeat(60)));
    console.log(chalk.bold.cyan('Total Treasury Value:'), chalk.bold.green(`~$${totalValueUSD.toFixed(2)}`));
    console.log(chalk.gray('='.repeat(60)));
    console.log(chalk.green('\n✓ Balance check complete\n'));
    
  } catch (error) {
    handleError(error, 'Balance check');
    process.exit(1);
  }
}

async function getVaultBalance(name, vaultAddress, walletAddress, provider) {
  const vault = new ethers.Contract(vaultAddress, config.vaultABI, provider);
  
  try {
    console.log(chalk.bold.yellow(`\n${name} Holdings`));
    
    // Get share balance
    const shares = await vault.balanceOf(walletAddress);
    
    if (shares === 0n) {
      console.log(chalk.gray('  └─ No holdings'));
      return 0;
    }
    
    // Convert shares to assets
    const assets = await vault.convertToAssets(shares);
    
    // Get asset details
    const assetAddress = await vault.asset();
    const assetContract = new ethers.Contract(assetAddress, config.tokenABI, provider);
    const decimals = await assetContract.decimals();
    const symbol = await assetContract.symbol();
    
    const sharesFormatted = formatAmount(shares, 18); // jUSDi has 18 decimals
    const assetsFormatted = formatAmount(assets, decimals);
    
    console.log(chalk.gray('  ├─ Shares:'), chalk.cyan(`${sharesFormatted} ${name}`));
    console.log(chalk.gray('  ├─ Underlying:'), chalk.cyan(`${assetsFormatted} ${symbol}`));
    
    // For stablecoins, assume $1 = 1 USDC/USDT
    const valueUSD = symbol === 'USDC' || symbol === 'USDT' 
      ? parseFloat(assetsFormatted) 
      : 0;
    
    if (valueUSD > 0) {
      console.log(chalk.gray('  └─ USD Value:'), chalk.green(`$${valueUSD.toFixed(2)}`));
    }
    
    return valueUSD;
    
  } catch (error) {
    console.log(chalk.red(`  Error fetching ${name} balance:`, error.message));
    return 0;
  }
}

// CLI Execution
if (require.main === module) {
  const chain = process.argv[2] || process.env.DEFAULT_CHAIN || 'base';
  getBalance(chain);
}

module.exports = { getBalance };
