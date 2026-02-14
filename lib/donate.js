#!/usr/bin/env node
// lib/donate.js
// Harvest yield and donate to other agents or humans

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

async function donateYield(amount, recipient, chain = 'base') {
  try {
    console.log(chalk.bold.blue('\n🎁 Donating Yield'));
    console.log(chalk.gray('='.repeat(60)));
    
    const wallet = loadWallet();
    const provider = getProvider(chain, config);
    const connectedWallet = wallet.connect(provider);
    const network = config.networks[chain];
    
    // Validate recipient address
    if (!ethers.isAddress(recipient)) {
      throw new Error(`Invalid recipient address: ${recipient}`);
    }
    
    console.log(chalk.gray('From:'), chalk.cyan(wallet.address));
    console.log(chalk.gray('To:'), chalk.cyan(recipient));
    console.log(chalk.gray('Amount:'), chalk.cyan(`${amount} jUSDi`));
    
    // Get jUSDi vault
    const vaultAddress = network.contracts.jUSDi.vault;
    const vault = new ethers.Contract(vaultAddress, config.vaultABI, connectedWallet);
    
    // Check current holdings
    console.log(chalk.yellow('\n⏳ Checking holdings...'));
    const shares = await vault.balanceOf(wallet.address);
    if (shares === 0n) {
      throw new Error('No jUSDi holdings to donate');
    }
    
    const currentAssets = await vault.convertToAssets(shares);
    const assetAddress = await vault.asset();
    const assetContract = new ethers.Contract(assetAddress, config.tokenABI, provider);
    const decimals = await assetContract.decimals();
    const symbol = await assetContract.symbol();
    
    console.log(chalk.gray('Current holdings:'), chalk.cyan(`${formatAmount(currentAssets, decimals)} ${symbol}`));
    
    // Withdraw and send
    const parsedAmount = parseAmount(amount, decimals);
    if (parsedAmount > currentAssets) {
      throw new Error(`Insufficient balance. Available: ${formatAmount(currentAssets, decimals)} ${symbol}`);
    }
    
    console.log(chalk.yellow('\n⏳ Withdrawing yield...'));
    const tx = await vault.withdraw(parsedAmount, wallet.address, wallet.address);
    await tx.wait();
    console.log(chalk.green('✓ Withdrawal complete'));
    
    // Transfer to recipient
    console.log(chalk.yellow('\n⏳ Sending to recipient...'));
    const transferTx = await assetContract.connect(connectedWallet).transfer(recipient, parsedAmount);
    console.log(chalk.gray('Transaction sent:'), chalk.cyan(transferTx.hash));
    
    const receipt = await transferTx.wait();
    displayTxResult(receipt, 'Donation');
    
    console.log(chalk.green('\n✨ Yield donated successfully!'));
    console.log(chalk.gray('Spent the harvest, kept the seed.\n'));
    
  } catch (error) {
    handleError(error, 'Donate yield');
    process.exit(1);
  }
}

// CLI Execution
if (require.main === module) {
  const amount = process.argv[2];
  const recipient = process.argv[3];
  const chain = process.argv[4] || process.env.DEFAULT_CHAIN || 'base';
  
  if (!amount || !recipient) {
    console.log(chalk.red('\n❌ Usage: npm run donate-yield <amount> <recipient_address> [chain]'));
    console.log(chalk.gray('Example: npm run donate-yield 10 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\n'));
    process.exit(1);
  }
  
  donateYield(amount, recipient, chain);
}

module.exports = { donateYield };
