# Installation & Setup Guide

Complete guide for installing the Jubilee OpenClaw Skill from scratch.

## Prerequisites

Before installing, ensure you have:

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **npm** v8 or higher (comes with Node.js)
- **git** (for cloning the repository)
- **OpenClaw** installed ([OpenClaw Docs](https://github.com/openclaw/openclaw))

## Step 1: Install the Skill

### Option A: Via OpenClaw Skills Directory

```bash
# Navigate to OpenClaw skills directory
cd ~/.openclaw/workspace/skills

# Clone the repository
git clone https://github.com/Jubilee-Protocol/openclaw-skill-jubilee.git jubilee

# Enter directory
cd jubilee

# Install dependencies
npm install
```

### Option B: Standalone Installation

```bash
# Clone anywhere
git clone https://github.com/Jubilee-Protocol/openclaw-skill-jubilee.git
cd openclaw-skill-jubilee

# Install dependencies
npm install
```

## Step 2: Configure Environment

### Create `.env` file

```bash
# Copy example environment file
cp .env.example .env

# Edit with your preferred editor
nano .env  # or vim, code, etc.
```

### Minimal Configuration

For most users, the default configuration works fine. Just set:

```bash
DEFAULT_CHAIN=base
DEBUG=false
```

### Custom RPC Endpoints (Optional)

If you have custom RPC providers (faster, more reliable):

```bash
RPC_BASE=https://your-custom-base-rpc.com
RPC_SOLANA=https://your-custom-solana-rpc.com
```

**Recommended RPC Providers:**
- [Alchemy](https://www.alchemy.com/) (Free tier available)
- [Infura](https://www.infura.io/) (Free tier available)
- [QuickNode](https://www.quicknode.com/) (Paid but fast)

## Step 3: Create Agent Wallet

### Option A: Use OpenClaw's Default Location

```bash
# Create wallet directory
mkdir -p ~/.openclaw/workspace/setup_wallet_dir_new/wallets

# Create wallet file
nano ~/.openclaw/workspace/setup_wallet_dir_new/wallets/agent_wallet.json
```

Add this content (replace with your private key):

```json
{
  "privateKey": "0xYOUR_PRIVATE_KEY_HERE"
}
```

### Option B: Generate New Wallet

If you don't have a wallet yet:

```bash
# Install ethers globally
npm install -g ethers

# Generate new wallet (in Node.js REPL)
node
> const { ethers } = require('ethers');
> const wallet = ethers.Wallet.createRandom();
> console.log('Address:', wallet.address);
> console.log('Private Key:', wallet.privateKey);
> console.log('Mnemonic:', wallet.mnemonic.phrase);
```

**⚠️ SECURITY WARNING:**
- **Never share your private key**
- **Never commit wallet files to git**
- **Back up your mnemonic phrase offline**

### Option C: Custom Wallet Path

If you prefer a different location:

```bash
# In .env
WALLET_PATH=/path/to/your/wallet.json
```

## Step 4: Fund Your Wallet

### For Testnet (Recommended First)

#### Base Sepolia Testnet

1. **Get ETH for gas:**
   - [Superchain Faucet](https://www.alchemy.com/faucets/base-sepolia)
   - Request ~0.1 ETH

2. **Get test USDC:**
   - [Circle Faucet](https://faucet.circle.com/)
   - Request 100 USDC

#### Verify Testnet Balance

```bash
# Set chain to testnet in .env
DEFAULT_CHAIN=baseSepolia

# Check balance
npm run balance
```

You should see:
```
Gas Balance: 0.1 ETH
jUSDi Holdings: 0 (no deposits yet)
```

### For Mainnet (Production)

#### Get Real Assets

1. **Purchase ETH:**
   - Use Coinbase, Binance, or your preferred exchange
   - Bridge to Base: [Base Bridge](https://bridge.base.org/)

2. **Purchase USDC:**
   - Use any exchange with Base support
   - Or bridge USDC from Ethereum to Base

#### Minimum Recommended Amounts

| Asset | Purpose | Minimum | Recommended |
|-------|---------|---------|-------------|
| ETH | Gas fees | 0.01 ETH | 0.05 ETH |
| USDC | Treasury | $100 | $1,000+ |

## Step 5: Verify Installation

### Run Tests

```bash
npm test
```

Expected output:
```
✓ RPC Connection to Base Sepolia
✓ Contract Addresses Configured
✓ Vault Contract Accessibility
✓ Asset Token Accessibility
✓ Amount Formatting
✓ Status Function Execution

All tests passed! ✨
```

### Check Vault Status

```bash
npm run status
```

Expected output:
```
🏛️  Jubilee Protocol Status - BASE

jUSDi Vault
Address: 0x26c39532C0dD06C0c4EddAeE36979626b16c77aC
Total Value Locked: 500,000 USDC
Base Asset: USDC (0x833589...)
Target APY: 3-6%

jBTCi Vault
Address: 0x8a4C0254258F0D3dB7Bc5C5A43825Bb4EfC81337
Total Value Locked: 10 BTC
Target APY: 6-8%

✓ Status check complete
```

### Check Your Balance

```bash
npm run balance
```

Expected output (if funded):
```
💰 Treasury Balance - BASE

Agent Address: 0xYourAddress...

Gas Balance: 0.05 ETH

jUSDi Holdings: 0 jUSDi
  └─ No holdings

Total Treasury Value: ~$0.00

✓ Balance check complete
```

## Step 6: Make Your First Deposit (Testnet)

### Deposit Test USDC

```bash
# Deposit 10 USDC into jUSDi vault
npm run deposit 10 USDC baseSepolia
```

Expected flow:
```
📥 Depositing to Jubilee Vault

Target Vault: jUSDi
Amount: 10 USDC
Agent: 0xYourAddress...

⏳ Checking balance...
✓ Sufficient balance

⏳ Checking allowance...
⏳ Approving token spending...
✓ Approval confirmed

⏳ Depositing to vault...
Transaction sent: 0x...

✓ Deposit successful!
Transaction Hash: 0x...
Block Number: 12345
Gas Used: 150000

New balance: 10.0 jUSDi
```

### Verify Deposit

```bash
npm run balance baseSepolia
```

You should now see:
```
jUSDi Holdings
  ├─ Shares: 10.0 jUSDi
  ├─ Underlying: 10.0 USDC
  └─ USD Value: $10.00

Total Treasury Value: ~$10.00
```

## Step 7: Integration with OpenClaw

### Register Skill with Agent

If using OpenClaw, the agent should automatically detect skills in `~/.openclaw/workspace/skills/`.

Test by asking your agent:
```
"Check our Jubilee treasury status"
```

The agent should respond with vault statistics.

### Create Custom Commands (Optional)

Add to your OpenClaw agent's configuration:

```javascript
// In your agent config
customCommands: {
  'treasury-report': 'npm run war-room --prefix ~/.openclaw/workspace/skills/jubilee',
  'deposit-funds': 'npm run deposit --prefix ~/.openclaw/workspace/skills/jubilee',
  // ... more commands
}
```

## Step 8: Production Deployment (Mainnet)

Once comfortable with testnet:

### Switch to Mainnet

```bash
# In .env
DEFAULT_CHAIN=base

# Verify mainnet connection
npm run status base
```

### Make Production Deposit

```bash
# Deposit real USDC
npm run deposit 1000 USDC base
```

### Set Up Monitoring

#### Daily Health Checks (Cron)

```bash
# Edit crontab
crontab -e

# Add daily war room report at 9 AM
0 9 * * * cd ~/.openclaw/workspace/skills/jubilee && npm run war-room >> logs/war-room.log 2>&1
```

#### GitHub Actions (Optional)

Create `.github/workflows/daily-report.yml`:

```yaml
name: Daily Treasury Report

on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC daily

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run war-room
        env:
          WALLET_PATH: ${{ secrets.WALLET_PATH }}
          RPC_BASE: ${{ secrets.RPC_BASE }}
```

## Troubleshooting

### Issue: "Cannot find module 'ethers'"

**Solution:**
```bash
npm install
```

### Issue: "Wallet file not found"

**Solution:**
```bash
# Verify wallet exists
ls ~/.openclaw/workspace/setup_wallet_dir_new/wallets/agent_wallet.json

# If missing, create it (see Step 3)
```

### Issue: "Network request failed"

**Solution:**
```bash
# Test RPC connection
curl https://mainnet.base.org \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}'

# If fails, use custom RPC in .env
```

### Issue: "Insufficient funds for gas"

**Solution:**
```bash
# Check ETH balance
npm run balance

# Fund wallet with ETH if below 0.01
```

### Issue: "Transaction would likely fail"

**Solution:**
```bash
# Check balances
npm run balance

# Verify allowances (automatic in deposit flow)

# Check vault health
npm run status
```

## Next Steps

### Learn More
- Read the full [README.md](README.md)
- Review [SKILL.md](SKILL.md) for AI agent integration
- Explore [Jubilee Protocol Docs](https://docs.jubileeprotocol.xyz)

### Join the Community
- [Discord](https://discord.gg/jubilee)
- [Twitter](https://twitter.com/JubileeProtocol)
- [GitHub](https://github.com/Jubilee-Protocol)

### Advanced Topics
- Multi-chain deployment (Base + Solana + Ethereum)
- Automated yield harvesting strategies
- Custom donation schedules
- Integration with other DeFi protocols

---

**Congratulations!** You've successfully installed the Jubilee OpenClaw Skill. Your agent is now capable of stewardship-aligned treasury management.

> **"Spend the harvest, keep the seed."**
