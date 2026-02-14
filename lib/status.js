#!/usr/bin/env node
// lib/status.js
// Check Jubilee Protocol vault status and stats

require('dotenv').config();
const { ethers } = require('ethers');
const chalk = require('chalk');
const config = require('../config');
const { getProvider, formatAmount, handleError } = require('./utils');

async function getVaultStatus(chain = 'base') {
  try {
    console.log(chalk.bold.blue(`\n🏛️  Jubilee Protocol Status - ${chain.toUpperCase()}`));
    console.log(chalk.gray('='.repeat(60)));
    
    const provider = getProvider(chain, config);
    const network = config.networks[chain];
    
    if (!network || !network.contracts) {
      throw new Error(`No contracts configured for ${chain}`);
    }
    
    // Check jUSDi Vault
    if (network.contracts.jUSDi) {
      await checkVault('jUSDi', network.contracts.jUSDi.vault, provider);
    }
    
    // Check jBTCi Vault
    if (network.contracts.jBTCi) {
      await checkVault('jBTCi', network.contracts.jBTCi.vault, provider);
    }
    
    console.log(chalk.gray('='.repeat(60)));
    console.log(chalk.gray('Note: APY values are estimated targets, not real-time data'));
    console.log(chalk.green('✓ Status check complete\n'));
    
  } catch (error) {
    handleError(error, 'Status check');
    process.exit(1);
  }
}

async function checkVault(name, address, provider) {
  const vault = new ethers.Contract(address, config.vaultABI, provider);
  
  try {
    console.log(chalk.bold.yellow(`\n${name} Vault`));
    console.log(chalk.gray(`Address: ${address}`));
    
    // Get total assets (TVL)
    const totalAssets = await vault.totalAssets();
    const assetAddress = await vault.asset();
    
    // Get asset details
    const assetContract = new ethers.Contract(assetAddress, config.tokenABI, provider);
    const decimals = await assetContract.decimals();
    const symbol = await assetContract.symbol();
    
    const tvl = formatAmount(totalAssets, decimals);
    console.log(chalk.gray('Total Value Locked:'), chalk.cyan(`${tvl} ${symbol}`));
    console.log(chalk.gray('Base Asset:'), chalk.cyan(`${symbol} (${assetAddress.slice(0, 10)}...)`));
    
    // Try to get managed balances if available
    try {
      const managedBalance = await vault.managedBalanceOf(assetAddress);
      console.log(chalk.gray('Managed Balance:'), chalk.cyan(`${formatAmount(managedBalance, decimals)} ${symbol}`));
    } catch (e) {
      // Method may not exist on all vault versions
    }
    
    // Display estimated APY with clear labeling
    const estimatedAPY = name === 'jUSDi' ? '3-6%' : '6-8%';
    console.log(chalk.gray('Target APY:'), chalk.cyan(`${estimatedAPY} (estimated)`));
    
    // Show vault health indicator
    if (totalAssets > 0) {
      console.log(chalk.green('✓ Vault is active and operational'));
    } else {
      console.log(chalk.yellow('⚠ Vault has no deposits yet'));
    }
    
  } catch (error) {
    console.log(chalk.red(`  ✗ Error fetching ${name} data: ${error.message}`));
  }
}

// CLI Execution
if (require.main === module) {
  const chain = process.argv[2] || process.env.DEFAULT_CHAIN || 'base';
  getVaultStatus(chain);
}

module.exports = { getVaultStatus };
