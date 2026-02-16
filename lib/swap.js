#!/usr/bin/env node
// lib/swap.js
// Execute token swaps using 0x Swap API on Base

require('dotenv').config();
const axios = require('axios');
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
  validateAsset, 
  validateChain, 
  displayValidationError, 
  ValidationError 
} = require('./validators');

/**
 * Get token decimals dynamically
 * @param {string} tokenAddress - Token contract address
 * @param {object} provider - Ethers provider
 * @returns {number} Token decimals
 */
async function getTokenDecimals(tokenAddress, provider) {
  // ETH native token
  if (tokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    return 18;
  }
  
  // ERC-20 token
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ['function decimals() view returns (uint8)'],
    provider
  );
  
  return await tokenContract.decimals();
}

/**
 * Get token symbol dynamically
 * @param {string} tokenAddress - Token contract address
 * @param {object} provider - Ethers provider
 * @returns {string} Token symbol
 */
async function getTokenSymbol(tokenAddress, provider) {
  // ETH native token
  if (tokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    return 'ETH';
  }
  
  // ERC-20 token
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ['function symbol() view returns (string)'],
    provider
  );
  
  return await tokenContract.symbol();
}

/**
 * Check and approve Permit2 allowance if needed
 * @param {object} wallet - Ethers wallet
 * @param {string} tokenAddress - Token to approve
 * @param {string} spender - Permit2 spender address
 * @param {string} amount - Amount to approve
 * @param {number} decimals - Token decimals
 */
async function ensurePermit2Approval(wallet, tokenAddress, spender, amount, decimals) {
  console.log(chalk.yellow('\n⏳ Checking Permit2 allowance...'));
  
  const tokenContract = new ethers.Contract(
    tokenAddress,
    [
      'function allowance(address owner, address spender) view returns (uint256)',
      'function approve(address spender, uint256 amount) returns (bool)'
    ],
    wallet
  );
  
  const currentAllowance = await tokenContract.allowance(wallet.address, spender);
  const requiredAmount = parseAmount(amount, decimals);
  
  if (currentAllowance >= requiredAmount) {
    console.log(chalk.green('✓ Sufficient allowance'));
    return;
  }
  
  console.log(chalk.yellow('⏳ Approving Permit2 contract...'));
  
  // Approve with buffer (2x required amount for future swaps)
  const approvalAmount = requiredAmount * 2n;
  
  const approveTx = await tokenContract.approve(spender, approvalAmount);
  console.log(chalk.gray('Approval transaction sent:'), chalk.cyan(approveTx.hash));
  
  await approveTx.wait();
  console.log(chalk.green('✓ Permit2 approved'));
}

/**
 * Get swap quote from 0x API
 * @param {object} params - Quote parameters
 * @param {object} config - Configuration object
 * @returns {object} Quote response
 */
async function get0xQuote(params, config) {
  try {
    const response = await axios.get(config.zeroEx.baseUrl, {
      params,
      headers: config.zeroEx.headers,
      timeout: 10000 // 10 second timeout
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // 0x API error
      const apiError = error.response.data;
      throw new Error(`0x API Error: ${apiError.reason || apiError.message || 'Unknown error'}`);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('0x API request timed out. Please try again.');
    } else {
      throw new Error(`Failed to get quote: ${error.message}`);
    }
  }
}

/**
 * Execute token swap using 0x API
 * @param {string} amount - Amount to swap
 * @param {string} fromSymbol - Source token symbol
 * @param {string} toSymbol - Destination token symbol
 * @param {string} chain - Network to use (default: base)
 */
async function swap(amount, fromSymbol, toSymbol, chain = 'base') {
  try {
    // Validate inputs
    validateAmount(amount, 'Swap amount');
    const validFromSymbol = validateAsset(fromSymbol.toUpperCase(), ['ETH', 'WETH', 'USDC', 'cbBTC', 'WBTC']);
    const validToSymbol = validateAsset(toSymbol.toUpperCase(), ['ETH', 'WETH', 'USDC', 'cbBTC', 'WBTC']);
    validateChain(chain, config);
    
    // Prevent swapping to same token
    if (validFromSymbol === validToSymbol) {
      throw new ValidationError('Cannot swap a token to itself');
    }
    
    console.log(chalk.bold.blue('\n🔄 Executing Token Swap'));
    console.log(chalk.gray('='.repeat(60)));
    
    // Setup
    const wallet = loadWallet();
    const provider = getProvider(chain, config);
    const connectedWallet = wallet.connect(provider);
    const network = config.networks[chain];
    
    // Get token addresses
    const fromToken = config.assets[chain][validFromSymbol];
    const toToken = config.assets[chain][validToSymbol];
    
    if (!fromToken || !toToken) {
      throw new Error(`Token not configured for ${chain}. Check config.js`);
    }
    
    console.log(chalk.gray('From:'), chalk.cyan(`${amount} ${validFromSymbol}`));
    console.log(chalk.gray('To:'), chalk.cyan(validToSymbol));
    console.log(chalk.gray('Trader:'), chalk.cyan(wallet.address));
    console.log(chalk.gray('Network:'), chalk.cyan(chain.toUpperCase()));
    
    // Get token decimals
    const fromDecimals = await getTokenDecimals(fromToken, provider);
    const toDecimals = await getTokenDecimals(toToken, provider);
    
    // Parse sell amount
    const sellAmount = parseAmount(amount, fromDecimals);
    
    // Check balance
    console.log(chalk.yellow('\n⏳ Checking balance...'));
    let balance;
    
    if (validFromSymbol === 'ETH') {
      balance = await provider.getBalance(wallet.address);
    } else {
      const tokenContract = new ethers.Contract(
        fromToken,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      balance = await tokenContract.balanceOf(wallet.address);
    }
    
    if (balance < sellAmount) {
      throw new Error(
        `Insufficient ${validFromSymbol} balance. ` +
        `Available: ${formatAmount(balance, fromDecimals)} ${validFromSymbol}, ` +
        `Required: ${amount} ${validFromSymbol}`
      );
    }
    console.log(chalk.green('✓ Sufficient balance'));
    
    // Get quote from 0x
    console.log(chalk.yellow('\n⏳ Fetching quote from 0x...'));
    
    const quoteParams = {
      chainId: network.chainId,
      sellToken: fromToken,
      buyToken: toToken,
      sellAmount: sellAmount.toString(),
      taker: wallet.address,
      slippagePercentage: '0.01' // 1% slippage tolerance
    };
    
    const quote = await get0xQuote(quoteParams, config);
    
    // Display quote
    const buyAmount = formatAmount(quote.buyAmount, toDecimals);
    const estimatedGas = quote.transaction.gas || quote.gas || 300000;
    
    console.log(chalk.green('✓ Quote received'));
    console.log(chalk.gray('  Expected output:'), chalk.cyan(`${buyAmount} ${validToSymbol}`));
    console.log(chalk.gray('  Estimated gas:'), chalk.cyan(estimatedGas));
    console.log(chalk.gray('  Price:'), chalk.cyan(quote.price || 'N/A'));
    
    // Check for quote issues
    if (quote.issues && quote.issues.allowance) {
      await ensurePermit2Approval(
        connectedWallet,
        fromToken,
        quote.issues.allowance.spender,
        amount,
        fromDecimals
      );
    }
    
    // Execute swap
    console.log(chalk.yellow('\n⏳ Executing swap...'));
    
    const tx = {
      to: quote.transaction.to,
      data: quote.transaction.data,
      value: quote.transaction.value || '0',
      gasLimit: Math.floor(estimatedGas * 1.2) // 20% buffer
    };
    
    // Estimate gas first
    try {
      await connectedWallet.estimateGas(tx);
    } catch (estimateError) {
      throw new Error(
        'Transaction would likely fail. Please check token balances and approvals. ' +
        `Details: ${estimateError.message}`
      );
    }
    
    const txResponse = await connectedWallet.sendTransaction(tx);
    console.log(chalk.gray('Transaction sent:'), chalk.cyan(txResponse.hash));
    
    const receipt = await txResponse.wait();
    displayTxResult(receipt, 'Swap');
    
    // Display final balances
    console.log(chalk.green('\n✨ Swap completed successfully!'));
    
    // Get new balances
    if (validToSymbol === 'ETH') {
      const newBalance = await provider.getBalance(wallet.address);
      console.log(chalk.gray('New ETH balance:'), chalk.cyan(`${formatAmount(newBalance, 18)} ETH`));
    } else {
      const toTokenContract = new ethers.Contract(
        toToken,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      const newBalance = await toTokenContract.balanceOf(wallet.address);
      console.log(chalk.gray(`New ${validToSymbol} balance:`), chalk.cyan(`${formatAmount(newBalance, toDecimals)} ${validToSymbol}`));
    }
    
    console.log(chalk.gray('\nView on BaseScan:'), chalk.cyan(`https://basescan.org/tx/${txResponse.hash}\n`));
    
  } catch (error) {
    if (error instanceof ValidationError) {
      displayValidationError(error, 'swap');
      process.exit(1);
    }
    handleError(error, 'Swap');
    process.exit(1);
  }
}

// CLI Execution
if (require.main === module) {
  const amount = process.argv[2];
  const fromSymbol = process.argv[3];
  const toSymbol = process.argv[4];
  const chain = process.argv[5] || process.env.DEFAULT_CHAIN || 'base';
  
  if (!amount || !fromSymbol || !toSymbol) {
    console.log(chalk.red('\n❌ Usage: npm run swap <amount> <fromToken> <toToken> [chain]'));
    console.log(chalk.gray('Example: npm run swap 0.01 ETH USDC base\n'));
    process.exit(1);
  }
  
  swap(amount, fromSymbol, toSymbol, chain);
}

module.exports = { swap };
