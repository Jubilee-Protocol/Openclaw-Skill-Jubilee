// lib/utils.js
// Utility functions for Jubilee OpenClaw Skill

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Load wallet from OpenClaw's standard wallet directory
 * @param {string} walletPath - Optional custom wallet path
 * @returns {ethers.Wallet} Wallet instance
 */
function loadWallet(walletPath) {
  const defaultPath = path.join(
    process.env.HOME || process.env.USERPROFILE,
    '.openclaw/workspace/setup_wallet_dir_new/wallets/agent_wallet.json'
  );
  
  const finalPath = walletPath || process.env.WALLET_PATH || defaultPath;
  
  try {
    if (!fs.existsSync(finalPath)) {
      throw new Error(`Wallet file not found at ${finalPath}`);
    }
    
    const walletData = JSON.parse(fs.readFileSync(finalPath, 'utf8'));
    
    // Support both encrypted and plaintext private keys
    if (walletData.privateKey) {
      return new ethers.Wallet(walletData.privateKey);
    } else if (walletData.encryptedJson) {
      // For encrypted wallets, would need password
      throw new Error('Encrypted wallets not yet supported. Use plaintext privateKey.');
    } else {
      throw new Error('Invalid wallet format. Expected { privateKey: "0x..." }');
    }
  } catch (error) {
    console.error(chalk.red('❌ Error loading wallet:'), error.message);
    throw error;
  }
}

/**
 * Get provider for a given chain
 * @param {string} chain - Chain name ('base', 'baseSepolia', etc.)
 * @param {object} config - Network configuration
 * @returns {ethers.JsonRpcProvider} Provider instance
 */
function getProvider(chain, config) {
  const network = config.networks[chain];
  if (!network) {
    throw new Error(`Unknown chain: ${chain}`);
  }
  
  return new ethers.JsonRpcProvider(network.rpc);
}

/**
 * Format token amount with proper decimals
 * @param {string|bigint} amount - Raw amount
 * @param {number} decimals - Token decimals
 * @returns {string} Formatted amount
 */
function formatAmount(amount, decimals = 6) {
  return ethers.formatUnits(amount, decimals);
}

/**
 * Parse token amount to raw units
 * @param {string} amount - Human-readable amount
 * @param {number} decimals - Token decimals
 * @returns {bigint} Raw amount
 */
function parseAmount(amount, decimals = 6) {
  return ethers.parseUnits(amount, decimals);
}

/**
 * Check if wallet has sufficient balance
 * @param {ethers.Contract} tokenContract - ERC20 contract
 * @param {string} address - Wallet address
 * @param {string} amount - Required amount
 * @param {number} decimals - Token decimals
 * @returns {Promise<boolean>} True if sufficient balance
 */
async function checkBalance(tokenContract, address, amount, decimals = 6) {
  const balance = await tokenContract.balanceOf(address);
  const required = parseAmount(amount, decimals);
  return balance >= required;
}

/**
 * Check and approve token spending if needed
 * @param {ethers.Contract} tokenContract - ERC20 contract
 * @param {string} spender - Spender address (vault)
 * @param {string} amount - Amount to approve
 * @param {ethers.Wallet} wallet - Signer wallet
 * @param {number} decimals - Token decimals
 * @returns {Promise<boolean>} True if approved
 */
async function ensureApproval(tokenContract, spender, amount, wallet, decimals = 6) {
  try {
    const currentAllowance = await tokenContract.allowance(wallet.address, spender);
    const required = parseAmount(amount, decimals);
    
    if (currentAllowance >= required) {
      console.log(chalk.green('✓ Sufficient allowance already exists'));
      return true;
    }
    
    console.log(chalk.yellow('⏳ Approving token spending...'));
    const tx = await tokenContract.connect(wallet).approve(spender, required);
    await tx.wait();
    console.log(chalk.green('✓ Approval confirmed'));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Approval failed:'), error.message);
    return false;
  }
}

/**
 * Display transaction result
 * @param {object} receipt - Transaction receipt
 * @param {string} action - Action description
 */
function displayTxResult(receipt, action) {
  console.log(chalk.green(`\n✓ ${action} successful!`));
  console.log(chalk.gray('Transaction Hash:'), chalk.cyan(receipt.hash));
  console.log(chalk.gray('Block Number:'), receipt.blockNumber);
  console.log(chalk.gray('Gas Used:'), receipt.gasUsed.toString());
}

/**
 * Handle errors gracefully
 * @param {Error} error - Error object
 * @param {string} context - Error context
 */
function handleError(error, context = 'Operation') {
  console.error(chalk.red(`\n❌ ${context} failed:`));
  
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.error(chalk.yellow('Insufficient ETH for gas fees'));
  } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    console.error(chalk.yellow('Transaction would likely fail. Check balances and allowances.'));
  } else if (error.reason) {
    console.error(chalk.yellow('Reason:'), error.reason);
  } else {
    console.error(chalk.yellow('Error:'), error.message);
  }
  
  if (process.env.DEBUG) {
    console.error(chalk.gray('\nFull error:'), error);
  }
}

module.exports = {
  loadWallet,
  getProvider,
  formatAmount,
  parseAmount,
  checkBalance,
  ensureApproval,
  displayTxResult,
  handleError
};
