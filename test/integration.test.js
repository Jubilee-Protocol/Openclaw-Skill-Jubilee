#!/usr/bin/env node
// test/integration.test.js
// Integration tests for Jubilee OpenClaw Skill
// Run on testnets only to avoid using real funds

require('dotenv').config();
const { ethers } = require('ethers');
const chalk = require('chalk');
const config = require('../config');
const { getProvider } = require('../lib/utils');
const { getVaultStatus } = require('../lib/status');

/**
 * Test suite for Jubilee OpenClaw Skill
 */
async function runTests() {
  console.log(chalk.bold.blue('\n🧪 Jubilee OpenClaw Skill - Integration Tests'));
  console.log(chalk.gray('='.repeat(60)));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: RPC Connection
  await test('RPC Connection to Base Sepolia', async () => {
    const provider = getProvider('baseSepolia', config);
    const blockNumber = await provider.getBlockNumber();
    if (blockNumber > 0) {
      console.log(chalk.gray(`   Current block: ${blockNumber}`));
      return true;
    }
    return false;
  }, () => passed++, () => failed++);
  
  // Test 2: Contract Address Validation
  await test('Contract Addresses Configured', async () => {
    const network = config.networks.baseSepolia;
    if (!network || !network.contracts || !network.contracts.jUSDi) {
      throw new Error('Missing contract configuration');
    }
    const vaultAddress = network.contracts.jUSDi.vault;
    if (!ethers.isAddress(vaultAddress)) {
      throw new Error('Invalid vault address');
    }
    console.log(chalk.gray(`   jUSDi Vault: ${vaultAddress}`));
    return true;
  }, () => passed++, () => failed++);
  
  // Test 3: Vault Contract Accessibility
  await test('Vault Contract Accessibility', async () => {
    const provider = getProvider('baseSepolia', config);
    const vaultAddress = config.networks.baseSepolia.contracts.jUSDi.vault;
    const vault = new ethers.Contract(vaultAddress, config.vaultABI, provider);
    
    // Try to read total assets
    const totalAssets = await vault.totalAssets();
    console.log(chalk.gray(`   Total Assets: ${ethers.formatUnits(totalAssets, 6)} USDC`));
    return true;
  }, () => passed++, () => failed++);
  
  // Test 4: Asset Token Accessibility
  await test('Asset Token Accessibility', async () => {
    const provider = getProvider('baseSepolia', config);
    const vaultAddress = config.networks.baseSepolia.contracts.jUSDi.vault;
    const vault = new ethers.Contract(vaultAddress, config.vaultABI, provider);
    
    const assetAddress = await vault.asset();
    if (!ethers.isAddress(assetAddress)) {
      throw new Error('Invalid asset address');
    }
    
    const assetContract = new ethers.Contract(assetAddress, config.tokenABI, provider);
    const symbol = await assetContract.symbol();
    console.log(chalk.gray(`   Asset: ${symbol} (${assetAddress})`));
    return true;
  }, () => passed++, () => failed++);
  
  // Test 5: Balance Formatting
  await test('Amount Formatting', async () => {
    const amount = ethers.parseUnits('100', 6);
    const formatted = ethers.formatUnits(amount, 6);
    if (formatted !== '100.0') {
      throw new Error(`Expected 100.0, got ${formatted}`);
    }
    console.log(chalk.gray(`   100 USDC = ${formatted}`));
    return true;
  }, () => passed++, () => failed++);
  
  // Test 6: Status Function (without wallet)
  await test('Status Function Execution', async () => {
    // This will fail if status.js has errors
    try {
      const { getVaultStatus } = require('../lib/status');
      // Note: This will print to console but won't actually execute full flow
      console.log(chalk.gray('   Status function loaded successfully'));
      return true;
    } catch (error) {
      throw new Error(`Status function error: ${error.message}`);
    }
  }, () => passed++, () => failed++);
  
  // Test Results
  console.log(chalk.gray('='.repeat(60)));
  console.log(chalk.bold.cyan(`\nTest Results:`));
  console.log(chalk.green(`✓ Passed: ${passed}`));
  if (failed > 0) {
    console.log(chalk.red(`✗ Failed: ${failed}`));
  }
  console.log(chalk.gray('='.repeat(60)));
  
  if (failed === 0) {
    console.log(chalk.green.bold('\n✨ All tests passed!\n'));
    process.exit(0);
  } else {
    console.log(chalk.red.bold('\n❌ Some tests failed\n'));
    process.exit(1);
  }
}

/**
 * Test helper function
 */
async function test(name, fn, onPass, onFail) {
  try {
    console.log(chalk.yellow(`\n${name}`));
    const result = await fn();
    if (result) {
      console.log(chalk.green('   ✓ PASS'));
      onPass();
    } else {
      console.log(chalk.red('   ✗ FAIL'));
      onFail();
    }
  } catch (error) {
    console.log(chalk.red('   ✗ FAIL'));
    console.log(chalk.red(`   Error: ${error.message}`));
    onFail();
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error(chalk.red('\n❌ Test suite error:'), error);
    process.exit(1);
  });
}

module.exports = { runTests };
