// lib/validators.js
// Input validation for CLI commands

const { ethers } = require('ethers');
const chalk = require('chalk');

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate numeric amount
 * @param {string} amount - Amount to validate
 * @param {string} context - Context for error message
 * @returns {number} Parsed amount
 */
function validateAmount(amount, context = 'Amount') {
  if (!amount || amount === '') {
    throw new ValidationError(`${context} is required`);
  }
  
  const parsed = parseFloat(amount);
  
  if (isNaN(parsed)) {
    throw new ValidationError(
      `Invalid ${context.toLowerCase()}: "${amount}". Must be a number.`
    );
  }
  
  if (parsed <= 0) {
    throw new ValidationError(`${context} must be greater than 0`);
  }
  
  if (parsed > 1e15) {
    throw new ValidationError(`${context} too large (max: 1,000,000,000,000,000)`);
  }
  
  // Check for reasonable decimal places (prevent issues with token decimals)
  const decimalPlaces = (amount.split('.')[1] || '').length;
  if (decimalPlaces > 18) {
    throw new ValidationError(`${context} has too many decimal places (max: 18)`);
  }
  
  return parsed;
}

/**
 * Validate Ethereum address
 * @param {string} address - Address to validate
 * @param {string} context - Context for error message
 * @returns {string} Validated address
 */
function validateAddress(address, context = 'Address') {
  if (!address || address === '') {
    throw new ValidationError(`${context} is required`);
  }
  
  if (!ethers.isAddress(address)) {
    throw new ValidationError(
      `Invalid ${context.toLowerCase()}: "${address}". Must be a valid Ethereum address (0x...)`
    );
  }
  
  return address;
}

/**
 * Validate chain name
 * @param {string} chain - Chain to validate
 * @param {object} config - Config object with networks
 * @returns {string} Validated chain
 */
function validateChain(chain, config) {
  const validChains = Object.keys(config.networks);
  
  if (!validChains.includes(chain)) {
    throw new ValidationError(
      `Invalid chain: "${chain}". Valid options: ${validChains.join(', ')}`
    );
  }
  
  return chain;
}

/**
 * Validate asset symbol
 * @param {string} asset - Asset symbol to validate
 * @param {array} validAssets - Array of valid asset symbols
 * @returns {string} Validated asset (uppercase)
 */
function validateAsset(asset, validAssets = ['USDC', 'USDT', 'cbBTC']) {
  if (!asset || asset === '') {
    throw new ValidationError('Asset is required');
  }
  
  const upperAsset = asset.toUpperCase();
  
  if (!validAssets.includes(upperAsset)) {
    throw new ValidationError(
      `Unsupported asset: "${asset}". Valid options: ${validAssets.join(', ')}`
    );
  }
  
  return upperAsset;
}

/**
 * Validate vault name
 * @param {string} vaultName - Vault name to validate
 * @param {array} validVaults - Array of valid vault names
 * @returns {string} Validated vault name (lowercase)
 */
function validateVaultName(vaultName, validVaults = ['jusdi', 'jbtci', 'jsols', 'jeths']) {
  if (!vaultName || vaultName === '') {
    throw new ValidationError('Vault name is required');
  }
  
  const lowerVault = vaultName.toLowerCase();
  
  if (!validVaults.includes(lowerVault)) {
    throw new ValidationError(
      `Unknown vault: "${vaultName}". Valid options: ${validVaults.join(', ')}`
    );
  }
  
  return lowerVault;
}

/**
 * Display validation error in user-friendly format
 * @param {ValidationError} error - Validation error
 * @param {string} command - Command name for usage example
 */
function displayValidationError(error, command) {
  console.error(chalk.red(`\n❌ Invalid input: ${error.message}`));
  
  // Show usage examples based on command
  const usageExamples = {
    deposit: 'npm run deposit <amount> <asset> [chain]\n   Example: npm run deposit 100 USDC base',
    withdraw: 'npm run withdraw <amount> <vault> [chain]\n   Example: npm run withdraw 50 jUSDi base',
    donate: 'npm run donate-yield <amount> <recipient_address> [chain]\n   Example: npm run donate-yield 10 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
  };
  
  if (usageExamples[command]) {
    console.log(chalk.yellow(`\nUsage: ${usageExamples[command]}\n`));
  }
}

module.exports = {
  validateAmount,
  validateAddress,
  validateChain,
  validateAsset,
  validateVaultName,
  displayValidationError,
  ValidationError
};
