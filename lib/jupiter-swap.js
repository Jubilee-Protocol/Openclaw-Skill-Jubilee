#!/usr/bin/env node
// lib/jupiter-swap.js
// Execute token swaps on Solana via Jupiter Ultra API

require('dotenv').config();
const axios = require('axios');
const { Connection, Keypair, VersionedTransaction } = require('@solana/web3.js');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const bs58 = require('bs58');
const config = require('../config');
const { handleError } = require('./utils');
const {
    validateAmount,
    displayValidationError,
    ValidationError
} = require('./validators');

// Jupiter API base URL
const JUPITER_BASE = 'https://api.jup.ag';

// Well-known Solana token mints
const SOLANA_MINTS = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    JITOSOL: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
    MSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    PYTH: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
    WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'
};

/**
 * Get Jupiter API headers
 */
function getJupiterHeaders() {
    const apiKey = process.env.JUPITER_API_KEY;
    if (!apiKey) {
        throw new Error(
            'JUPITER_API_KEY is required for Jupiter swaps.\n' +
            'Get a free key at: https://portal.jup.ag\n' +
            'Then add to .env: JUPITER_API_KEY=your_key_here'
        );
    }
    return {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
    };
}

/**
 * Load Solana wallet keypair
 */
function loadSolanaWallet() {
    const walletPath = process.env.SOLANA_WALLET_PATH || path.join(
        process.env.HOME || process.env.USERPROFILE,
        '.openclaw/workspace/setup_wallet_dir_new/wallets/solana_wallet.json'
    );

    // Also check for standard Solana CLI wallet
    const fallbackPath = path.join(
        process.env.HOME || process.env.USERPROFILE,
        '.config/solana/id.json'
    );

    const finalPath = fs.existsSync(walletPath) ? walletPath : fallbackPath;

    if (!fs.existsSync(finalPath)) {
        throw new Error(
            `Solana wallet not found.\n` +
            `  Checked: ${walletPath}\n` +
            `  Checked: ${fallbackPath}\n` +
            `  Set SOLANA_WALLET_PATH in .env or create a wallet with: solana-keygen new`
        );
    }

    const walletData = JSON.parse(fs.readFileSync(finalPath, 'utf8'));

    // Support array format (standard Solana CLI) or base58 private key
    if (Array.isArray(walletData)) {
        return Keypair.fromSecretKey(Uint8Array.from(walletData));
    } else if (walletData.privateKey) {
        // Base58 encoded private key
        return Keypair.fromSecretKey(bs58.decode(walletData.privateKey));
    } else {
        throw new Error('Invalid Solana wallet format. Expected JSON array or { privateKey: "base58..." }');
    }
}

/**
 * Resolve token mint address from symbol
 */
function resolveTokenMint(symbol) {
    const upperSymbol = symbol.toUpperCase();
    const mint = SOLANA_MINTS[upperSymbol];

    if (!mint) {
        // Check if it's already a mint address (base58, 32-44 chars)
        if (symbol.length >= 32 && symbol.length <= 44) {
            return symbol;
        }
        throw new ValidationError(
            `Unknown Solana token: "${symbol}". ` +
            `Supported: ${Object.keys(SOLANA_MINTS).join(', ')} or pass a mint address directly.`
        );
    }

    return mint;
}

/**
 * Get a Jupiter Ultra order (quote)
 */
async function getJupiterOrder(inputMint, outputMint, amount, walletAddress) {
    const headers = getJupiterHeaders();

    const params = {
        inputMint,
        outputMint,
        amount: amount.toString(),
        taker: walletAddress
    };

    try {
        const response = await axios.get(`${JUPITER_BASE}/ultra/v1/order`, {
            params,
            headers,
            timeout: 10000
        });
        return response.data;
    } catch (error) {
        if (error.response?.status === 429) {
            throw new Error('Jupiter API rate limited. Wait 10 seconds and try again.');
        }
        if (error.response?.data) {
            throw new Error(`Jupiter API error: ${JSON.stringify(error.response.data)}`);
        }
        throw new Error(`Failed to get Jupiter quote: ${error.message}`);
    }
}

/**
 * Execute a signed Jupiter Ultra order
 */
async function executeJupiterOrder(signedTransaction, requestId) {
    const headers = getJupiterHeaders();

    try {
        const response = await axios.post(`${JUPITER_BASE}/ultra/v1/execute`, {
            signedTransaction,
            requestId
        }, {
            headers,
            timeout: 30000
        });
        return response.data;
    } catch (error) {
        if (error.response?.data) {
            const data = error.response.data;
            throw new Error(`Jupiter execute error (code ${data.code || 'unknown'}): ${data.error || JSON.stringify(data)}`);
        }
        throw new Error(`Failed to execute Jupiter order: ${error.message}`);
    }
}

/**
 * Execute a Jupiter swap on Solana
 * @param {string} amount - Amount in human-readable format
 * @param {string} fromSymbol - Source token symbol or mint
 * @param {string} toSymbol - Destination token symbol or mint
 */
async function jupiterSwap(amount, fromSymbol, toSymbol) {
    try {
        validateAmount(amount, 'Swap amount');

        if (fromSymbol.toUpperCase() === toSymbol.toUpperCase()) {
            throw new ValidationError('Cannot swap a token to itself');
        }

        console.log(chalk.bold.green('\n🪐 Executing Jupiter Swap (Solana)'));
        console.log(chalk.gray('='.repeat(60)));

        // Resolve mints
        const inputMint = resolveTokenMint(fromSymbol);
        const outputMint = resolveTokenMint(toSymbol);

        // Load wallet
        const wallet = loadSolanaWallet();
        const walletAddress = wallet.publicKey.toBase58();

        console.log(chalk.gray('From:'), chalk.cyan(`${amount} ${fromSymbol.toUpperCase()}`));
        console.log(chalk.gray('To:'), chalk.cyan(toSymbol.toUpperCase()));
        console.log(chalk.gray('Router:'), chalk.cyan('Jupiter Ultra'));
        console.log(chalk.gray('Network:'), chalk.cyan('Solana'));
        console.log(chalk.gray('Wallet:'), chalk.cyan(walletAddress));

        // Determine amount in smallest units
        // SOL = 9 decimals, USDC/USDT = 6 decimals, most SPL = 6 or 9
        const isSOL = fromSymbol.toUpperCase() === 'SOL';
        const isStable = ['USDC', 'USDT'].includes(fromSymbol.toUpperCase());
        const decimals = isSOL ? 9 : isStable ? 6 : 6; // default 6 for most SPL
        const rawAmount = Math.floor(parseFloat(amount) * Math.pow(10, decimals));

        // Check SOL balance
        console.log(chalk.yellow('\n⏳ Checking balance...'));
        const rpcUrl = config.networks.solana?.rpcUrl || process.env.RPC_SOLANA || 'https://api.mainnet-beta.solana.com';
        const connection = new Connection(rpcUrl, 'confirmed');

        const solBalance = await connection.getBalance(wallet.publicKey);
        if (solBalance < 5000) { // ~0.000005 SOL minimum for tx fee
            throw new Error(`Insufficient SOL for transaction fees. Balance: ${(solBalance / 1e9).toFixed(6)} SOL`);
        }

        if (isSOL && solBalance < rawAmount) {
            throw new Error(
                `Insufficient SOL balance. Available: ${(solBalance / 1e9).toFixed(6)} SOL, Required: ${amount} SOL`
            );
        }
        console.log(chalk.green('✓ Balance check passed'));
        console.log(chalk.gray('  SOL balance:'), chalk.cyan(`${(solBalance / 1e9).toFixed(6)} SOL`));

        // Get Jupiter quote
        console.log(chalk.yellow('\n⏳ Fetching Jupiter order...'));
        const order = await getJupiterOrder(inputMint, outputMint, rawAmount, walletAddress);

        if (!order.transaction) {
            throw new Error('Jupiter returned no transaction. The pair may have insufficient liquidity.');
        }

        // Parse output amount
        const outDecimals = ['USDC', 'USDT'].includes(toSymbol.toUpperCase()) ? 6 :
            toSymbol.toUpperCase() === 'SOL' ? 9 : 6;
        const expectedOut = order.outAmount ? (parseInt(order.outAmount) / Math.pow(10, outDecimals)).toFixed(6) : 'N/A';

        console.log(chalk.green('✓ Order received'));
        console.log(chalk.gray('  Expected output:'), chalk.cyan(`${expectedOut} ${toSymbol.toUpperCase()}`));
        if (order.requestId) {
            console.log(chalk.gray('  Request ID:'), chalk.cyan(order.requestId));
        }

        // Sign the transaction
        console.log(chalk.yellow('\n⏳ Signing and executing...'));
        const txBuffer = Buffer.from(order.transaction, 'base64');
        const tx = VersionedTransaction.deserialize(txBuffer);
        tx.sign([wallet]);

        const signedTx = Buffer.from(tx.serialize()).toString('base64');

        // Execute via Jupiter
        const result = await executeJupiterOrder(signedTx, order.requestId);

        if (result.status === 'Success' || result.signature) {
            const sig = result.signature || result.txid || 'unknown';
            console.log(chalk.green('\n✨ Jupiter swap completed successfully!'));
            console.log(chalk.gray('Transaction:'), chalk.cyan(sig));
            console.log(chalk.gray('\nView on Solscan:'), chalk.cyan(`https://solscan.io/tx/${sig}\n`));
        } else {
            console.log(chalk.yellow('\n⚠️  Swap submitted but status unclear:'), JSON.stringify(result));
        }

    } catch (error) {
        if (error instanceof ValidationError) {
            displayValidationError(error, 'jupiter-swap');
            process.exit(1);
        }
        handleError(error, 'Jupiter Swap');
        process.exit(1);
    }
}

// CLI Execution
if (require.main === module) {
    const amount = process.argv[2];
    const fromSymbol = process.argv[3];
    const toSymbol = process.argv[4];

    if (!amount || !fromSymbol || !toSymbol) {
        console.log(chalk.red('\n❌ Usage: npm run jupiter-swap <amount> <fromToken> <toToken>'));
        console.log(chalk.gray('Example: npm run jupiter-swap 1 SOL USDC'));
        console.log(chalk.gray('Example: npm run jupiter-swap 50 USDC JUP'));
        console.log(chalk.gray(`Tokens:  ${Object.keys(SOLANA_MINTS).join(', ')}`));
        console.log(chalk.gray('         (or pass a raw mint address)\n'));
        process.exit(1);
    }

    jupiterSwap(amount, fromSymbol, toSymbol);
}

module.exports = { jupiterSwap, SOLANA_MINTS };
