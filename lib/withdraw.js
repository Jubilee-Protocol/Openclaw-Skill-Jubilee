#!/usr/bin/env node
// lib/withdraw.js
// Withdraw assets from Jubilee Protocol vaults

require('dotenv').config();
const { ethers } = require('ethers');
const chalk = require('chalk');
const config = require('../config');
const { 
  loadWallet, 
  getProvider, 
  parseAmount, 
  formatAmount,
  displayTxResult,
  handleError 
} = require('./utils');
const { 
  validateAmount, 
  validateVaultName, 
  validateChain, 
  displayValidationError, 
  ValidationError 
} = require('./validators');

async function withdraw(amount, vaultName, chain = 'base') {
  try {
    // Validate inputs FIRST
    validateAmount(amount, 'Withdrawal amount');
    const validVaultName = validateVaultName(vaultName);
    validateChain(chain, config);
    
    console.log(chalk.bold.blue('\n📤 Withdrawing from Jubilee Vault'));
    console.log(chalk.gray('='.repeat(60)));
    
    const wallet = loadWallet();
    const provider = getProvider(chain, config);
    const connectedWallet = wallet.connect(provider);
    const network = config.networks[chain];
    
    // Get vault address
    let vaultAddress;
    if (validVaultName === 'jusdi') {
      vaultAddress = network.contracts.jUSDi.vault;
    } else if (validVaultName === 'jbtci') {
      if (!network.contracts.jBTCi) {
        throw new Error(`jBTCi not available on ${chain}. Try 'base' network.`);
      }
      vaultAddress = network.contracts.jBTCi.vault;
    } else if (validVaultName === 'jsoli') {
      throw new Error('jSOLi withdrawals must be done on Solana network');
    } else {
      throw new Error(`Unknown vault: ${vaultName}. Use jUSDi or jBTCi.`);
    }
    
    console.log(chalk.gray('Vault:'), chalk.cyan(validVaultName.toUpperCase()));
    console.log(chalk.gray('Amount:'), chalk.cyan(`${amount} (underlying)`));
    console.log(chalk.gray('Agent:'), chalk.cyan(wallet.address));
    
    // Get vault contract
    const vault = new ethers.Contract(vaultAddress, config.vaultABI, connectedWallet);
    const assetAddress = await vault.asset();
    const assetContract = new ethers.Contract(assetAddress, config.tokenABI, provider);
    const decimals = await assetContract.decimals();
    const symbol = await assetContract.symbol();
    
    // Check current holdings
    console.log(chalk.yellow('\n⏳ Checking holdings...'));
    const shares = await vault.balanceOf(wallet.address);
    if (shares === 0n) {
      throw new Error(`No ${validVaultName.toUpperCase()} holdings to withdraw`);
    }
    
    const currentAssets = await vault.convertToAssets(shares);
    console.log(chalk.gray('Current holdings:'), chalk.cyan(`${formatAmount(currentAssets, decimals)} ${symbol}`));
    
    const parsedAmount = parseAmount(amount, decimals);
    if (parsedAmount > currentAssets) {
      throw new Error(
        `Insufficient balance. ` +
        `Available: ${formatAmount(currentAssets, decimals)} ${symbol}, ` +
        `Requested: ${amount} ${symbol}`
      );
    }
    
    // Warning for large withdrawals
    const withdrawalPct = (Number(parsedAmount) / Number(currentAssets)) * 100;
    if (withdrawalPct > 50) {
      console.log(chalk.yellow(
        `\n⚠️  Warning: Withdrawing ${withdrawalPct.toFixed(1)}% of your holdings.`
      ));
      console.log(chalk.yellow('   Remember: "Spend the harvest, keep the seed."'));
    }
    
    // Execute withdrawal
    console.log(chalk.yellow('\n⏳ Withdrawing from vault...'));
    
    // Estimate gas first
    try {
      await vault.withdraw.estimateGas(parsedAmount, wallet.address, wallet.address);
    } catch (estimateError) {
      throw new Error(
        'Transaction would likely fail. The vault may not have sufficient liquid assets. ' +
        `Details: ${estimateError.message}`
      );
    }
    
    const tx = await vault.withdraw(parsedAmount, wallet.address, wallet.address);
    console.log(chalk.gray('Transaction sent:'), chalk.cyan(tx.hash));
    
    const receipt = await tx.wait();
    displayTxResult(receipt, 'Withdrawal');
    
    // Get new balances
    const newShares = await vault.balanceOf(wallet.address);
    const newAssets = newShares > 0 ? await vault.convertToAssets(newShares) : 0n;
    const assetBalance = await assetContract.balanceOf(wallet.address);
    
    console.log(chalk.green('\nNew balances:'));
    console.log(chalk.gray('  Vault:'), chalk.cyan(`${formatAmount(newAssets, decimals)} ${symbol}`));
    console.log(chalk.gray('  Wallet:'), chalk.cyan(`${formatAmount(assetBalance, decimals)} ${symbol}`));
    console.log();
    
  } catch (error) {
    if (error instanceof ValidationError) {
      displayValidationError(error, 'withdraw');
      process.exit(1);
    }
    handleError(error, 'Withdrawal');
    process.exit(1);
  }
}

// CLI Execution
if (require.main === module) {
  const amount = process.argv[2];
  const vaultName = process.argv[3];
  const chain = process.argv[4] || process.env.DEFAULT_CHAIN || 'base';
  
  if (!amount || !vaultName) {
    console.log(chalk.red('\n❌ Usage: npm run withdraw <amount> <vault> [chain]'));
    console.log(chalk.gray('Example: npm run withdraw 50 jUSDi base\n'));
    process.exit(1);
  }
  
  withdraw(amount, vaultName, chain);
}

module.exports = { withdraw };
