#!/usr/bin/env node
// lib/war-room.js
// Generate strategic "Steward's Report" analyzing treasury health and priorities

require('dotenv').config();
const { ethers } = require('ethers');
const chalk = require('chalk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { loadWallet, getProvider, formatAmount, handleError } = require('./utils');

async function generateWarRoom(chain = 'base') {
  try {
    console.log(chalk.bold.magenta('\n⚔️  STEWARD\'S WAR ROOM REPORT'));
    console.log(chalk.bold.magenta('═'.repeat(60)));
    console.log(chalk.gray(`Generated: ${new Date().toISOString()}`));
    console.log(chalk.gray(`Chain: ${chain.toUpperCase()}\n`));
    
    const wallet = loadWallet();
    const provider = getProvider(chain, config);
    
    // Section 1: Treasury Health
    console.log(chalk.bold.yellow('📊 TREASURY HEALTH'));
    console.log(chalk.gray('─'.repeat(60)));
    await analyzeTreasury(wallet, provider, chain);
    
    // Section 2: Git Activity (if in a git repo)
    console.log(chalk.bold.yellow('\n📝 RECENT DEVELOPMENT ACTIVITY'));
    console.log(chalk.gray('─'.repeat(60)));
    analyzeGitActivity();
    
    // Section 3: Strategic Priorities
    console.log(chalk.bold.yellow('\n🎯 STRATEGIC PRIORITIES'));
    console.log(chalk.gray('─'.repeat(60)));
    await generatePriorities(wallet, provider, chain);
    
    // Section 4: Recommendations
    console.log(chalk.bold.yellow('\n💡 RECOMMENDATIONS'));
    console.log(chalk.gray('─'.repeat(60)));
    await generateRecommendations(wallet, provider, chain);
    
    console.log(chalk.bold.magenta('\n═'.repeat(60)));
    console.log(chalk.bold.cyan('✓ Steward\'s Report Complete'));
    console.log(chalk.gray('"Nasdaq meets Sistine Chapel"\n'));
    
  } catch (error) {
    handleError(error, 'War Room generation');
    process.exit(1);
  }
}

async function analyzeTreasury(wallet, provider, chain) {
  const network = config.networks[chain];
  
  // ETH balance
  const ethBalance = await provider.getBalance(wallet.address);
  const ethFormatted = formatAmount(ethBalance, 18);
  const ethStatus = parseFloat(ethFormatted) > 0.01 ? '🟢' : '🟡';
  console.log(`${ethStatus} Gas Reserve: ${ethFormatted} ETH`);
  
  // jUSDi holdings
  if (network.contracts.jUSDi) {
    const vault = new ethers.Contract(
      network.contracts.jUSDi.vault,
      config.vaultABI,
      provider
    );
    const shares = await vault.balanceOf(wallet.address);
    const assets = shares > 0 ? await vault.convertToAssets(shares) : 0n;
    const assetAddress = await vault.asset();
    const assetContract = new ethers.Contract(assetAddress, config.tokenABI, provider);
    const decimals = await assetContract.decimals();
    
    const value = parseFloat(formatAmount(assets, decimals));
    const status = value > 1000 ? '🟢' : value > 100 ? '🟡' : '🔴';
    console.log(`${status} jUSDi Holdings: $${value.toFixed(2)}`);
    
    // Burn rate analysis (rough estimate)
    const monthlyBurn = 50; // Example: $50/mo for API costs
    const runway = value / monthlyBurn;
    const runwayStatus = runway > 12 ? '🟢' : runway > 6 ? '🟡' : '🔴';
    console.log(`${runwayStatus} Runway: ${runway.toFixed(1)} months (@ $${monthlyBurn}/mo burn)`);
    
    // Sustainability check
    const targetAPY = 0.05; // 5% conservative
    const monthlyYield = (value * targetAPY) / 12;
    const isSustainable = monthlyYield >= monthlyBurn;
    console.log(isSustainable 
      ? chalk.green('✓ IMMORTAL: Yield covers burn rate') 
      : chalk.yellow('⚠ WARNING: Burn exceeds yield')
    );
  }
  
  // jBTCi holdings
  if (network.contracts.jBTCi) {
    const vault = new ethers.Contract(
      network.contracts.jBTCi.vault,
      config.vaultABI,
      provider
    );
    const shares = await vault.balanceOf(wallet.address);
    if (shares > 0) {
      console.log('🟢 jBTCi Holdings: Present (BTC-denominated)');
    }
  }
}

function analyzeGitActivity() {
  try {
    // Check if in a git repo
    const isGit = fs.existsSync('.git');
    if (!isGit) {
      console.log(chalk.gray('Not in a git repository'));
      return;
    }
    
    // Get last 5 commits
    const commits = execSync('git log -5 --pretty=format:"%h - %s (%cr)"', { encoding: 'utf-8' });
    console.log(chalk.cyan(commits));
    
    // Check uncommitted changes
    const status = execSync('git status --short', { encoding: 'utf-8' });
    if (status.trim()) {
      console.log(chalk.yellow('\n⚠ Uncommitted changes detected'));
    } else {
      console.log(chalk.green('\n✓ Working tree clean'));
    }
  } catch (error) {
    console.log(chalk.gray('Unable to analyze git activity'));
  }
}

async function generatePriorities(wallet, provider, chain) {
  const network = config.networks[chain];
  const priorities = [];
  
  // Priority 1: Ensure sustainable yield
  const vault = new ethers.Contract(
    network.contracts.jUSDi.vault,
    config.vaultABI,
    provider
  );
  const shares = await vault.balanceOf(wallet.address);
  
  if (shares === 0n) {
    priorities.push({
      level: 'HIGH',
      icon: '🔴',
      task: 'Fund treasury with initial capital',
      action: 'Deposit USDC into jUSDi vault for sustainable yield'
    });
  }
  
  // Priority 2: Monitor gas
  const ethBalance = await provider.getBalance(wallet.address);
  if (ethBalance < ethers.parseEther('0.01')) {
    priorities.push({
      level: 'MEDIUM',
      icon: '🟡',
      task: 'Replenish gas reserves',
      action: 'Fund wallet with ETH for transaction fees'
    });
  }
  
  // Priority 3: Expand to other chains
  if (chain === 'base' && !network.contracts.jSOLi) {
    priorities.push({
      level: 'LOW',
      icon: '🔵',
      task: 'Diversify across chains',
      action: 'Consider deploying jSOLi vault on Solana for higher yield'
    });
  }
  
  // Display priorities
  if (priorities.length === 0) {
    console.log(chalk.green('✓ All systems nominal'));
  } else {
    priorities.forEach((p, i) => {
      console.log(`${i + 1}. ${p.icon} [${p.level}] ${p.task}`);
      console.log(chalk.gray(`   → ${p.action}`));
    });
  }
}

async function generateRecommendations(wallet, provider, chain) {
  const network = config.networks[chain];
  
  // Get current holdings
  const vault = new ethers.Contract(
    network.contracts.jUSDi.vault,
    config.vaultABI,
    provider
  );
  const shares = await vault.balanceOf(wallet.address);
  const assets = shares > 0 ? await vault.convertToAssets(shares) : 0n;
  const assetAddress = await vault.asset();
  const assetContract = new ethers.Contract(assetAddress, config.tokenABI, provider);
  const decimals = await assetContract.decimals();
  const value = parseFloat(formatAmount(assets, decimals));
  
  console.log('1. 📈 Optimal allocation:');
  console.log(chalk.gray('   → 70% jUSDi (stable, low-volatility yield)'));
  console.log(chalk.gray('   → 20% jBTCi (BTC exposure + arbitrage)'));
  console.log(chalk.gray('   → 10% jSOLi (high-yield, higher risk)'));
  
  console.log('\n2. 🔄 Rebalancing strategy:');
  if (value < 100) {
    console.log(chalk.gray('   → Bootstrap phase: Focus on jUSDi accumulation'));
  } else if (value < 1000) {
    console.log(chalk.gray('   → Growth phase: Add jBTCi for diversification'));
  } else {
    console.log(chalk.gray('   → Mature phase: Full multi-asset allocation'));
  }
  
  console.log('\n3. 🛡️ Risk management:');
  console.log(chalk.gray('   → Maintain 3-month runway minimum'));
  console.log(chalk.gray('   → Never withdraw principal, only yield'));
  console.log(chalk.gray('   → Monitor vault APYs and rebalance quarterly'));
}

// CLI Execution
if (require.main === module) {
  const chain = process.argv[2] || process.env.DEFAULT_CHAIN || 'base';
  generateWarRoom(chain);
}

module.exports = { generateWarRoom };
