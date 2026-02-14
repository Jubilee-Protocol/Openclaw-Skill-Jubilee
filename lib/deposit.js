#!/usr/bin/env node
// lib/deposit.js
// Deposit assets into Jubilee Protocol vaults

require('dotenv').config();
const { ethers } = require('ethers');
const chalk = require('chalk');
const config = require('../config');
const { 
  loadWallet, 
  getProvider, 
  parseAmount, 
  formatAmount,
  checkBalance,
  ensureApproval,
  displayTxResult,
  handleError 
} = require('./utils');

async function deposit(amount, asset, chain = 'base') {
  try {
    console.log(chalk.bold.blue('\n📥 Depositing to Jubilee Vault'));
    console.log(chalk.gray('='.repeat(60)));
    
    const wallet = loadWallet();
    const provider = getProvider(chain, config);
    const connectedWallet = wallet.connect(provider);
    const network = config.networks[chain];
    
    // Determine which vault to use based on asset
    let vaultAddress, vaultName;
    if (asset.toUpperCase() === 'USDC' || asset.toUpperCase() === 'USDT') {
      vaultAddress = network.contracts.jUSDi.vault;
      vaultName = 'jUSDi';
    } else if (asset.toUpperCase().includes('BTC')) {
      vaultAddress = network.contracts.jBTCi.vault;
      vaultName = 'jBTCi';
    } else {
      throw new Error(`Unsupported asset: ${asset}. Use USDC, USDT, or BTC assets.`);
    }
    
    console.log(chalk.gray('Target Vault:'), chalk.cyan(vaultName));
    console.log(chalk.gray('Amount:'), chalk.cyan(`${amount} ${asset.toUpperCase()}`));
    console.log(chalk.gray('Agent:'), chalk.cyan(wallet.address));
    
    // Get vault contract
    const vault = new ethers.Contract(vaultAddress, config.vaultABI, connectedWallet);
    const assetAddress = await vault.asset();
    const assetContract = new ethers.Contract(assetAddress, config.tokenABI, connectedWallet);
    const decimals = await assetContract.decimals();
    
    // Check balance
    console.log(chalk.yellow('\n⏳ Checking balance...'));
    const hasBalance = await checkBalance(assetContract, wallet.address, amount, decimals);
    if (!hasBalance) {
      throw new Error(`Insufficient ${asset} balance`);
    }
    console.log(chalk.green('✓ Sufficient balance'));
    
    // Approve if needed
    console.log(chalk.yellow('\n⏳ Checking allowance...'));
    const approved = await ensureApproval(
      assetContract,
      vaultAddress,
      amount,
      connectedWallet,
      decimals
    );
    if (!approved) {
      throw new Error('Failed to approve token spending');
    }
    
    // Execute deposit
    console.log(chalk.yellow('\n⏳ Depositing to vault...'));
    const parsedAmount = parseAmount(amount, decimals);
    const tx = await vault.deposit(parsedAmount, wallet.address);
    console.log(chalk.gray('Transaction sent:'), chalk.cyan(tx.hash));
    
    const receipt = await tx.wait();
    displayTxResult(receipt, 'Deposit');
    
    // Get new balance
    const shares = await vault.balanceOf(wallet.address);
    const sharesFormatted = formatAmount(shares, 18);
    console.log(chalk.green('\nNew balance:'), chalk.cyan(`${sharesFormatted} ${vaultName}`));
    
  } catch (error) {
    handleError(error, 'Deposit');
    process.exit(1);
  }
}

// CLI Execution
if (require.main === module) {
  const amount = process.argv[2];
  const asset = process.argv[3];
  const chain = process.argv[4] || process.env.DEFAULT_CHAIN || 'base';
  
  if (!amount || !asset) {
    console.log(chalk.red('\n❌ Usage: npm run deposit <amount> <asset> [chain]'));
    console.log(chalk.gray('Example: npm run deposit 100 USDC base\n'));
    process.exit(1);
  }
  
  deposit(amount, asset, chain);
}

module.exports = { deposit };
