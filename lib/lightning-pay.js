#!/usr/bin/env node
// lib/lightning-pay.js
// Bitcoin Lightning Network payments via LND REST API or lncli

require('dotenv').config();
const axios = require('axios');
const { execSync, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const https = require('https');
const { handleError } = require('./utils');
const {
    validateAmount,
    displayValidationError,
    ValidationError
} = require('./validators');

/**
 * Get LND connection config from environment
 */
function getLndConfig() {
    const host = process.env.LND_REST_HOST || 'https://localhost:8080';
    const macaroonPath = process.env.LND_MACAROON_PATH || path.join(
        process.env.HOME || process.env.USERPROFILE,
        '.lnd/data/chain/bitcoin/mainnet/admin.macaroon'
    );
    const tlsCertPath = process.env.LND_TLS_CERT_PATH || path.join(
        process.env.HOME || process.env.USERPROFILE,
        '.lnd/tls.cert'
    );

    return { host, macaroonPath, tlsCertPath };
}

/**
 * Check if lncli is available on PATH
 */
function hasLncli() {
    try {
        execSync('which lncli', { stdio: 'pipe' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if lnget is available on PATH
 */
function hasLnget() {
    try {
        execSync('which lnget', { stdio: 'pipe' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Create axios instance for LND REST API
 */
function createLndClient() {
    const config = getLndConfig();

    let macaroon;
    try {
        macaroon = fs.readFileSync(config.macaroonPath).toString('hex');
    } catch {
        return null; // No macaroon, will fallback to lncli
    }

    let httpsAgent;
    try {
        const cert = fs.readFileSync(config.tlsCertPath);
        httpsAgent = new https.Agent({ ca: cert, rejectUnauthorized: false });
    } catch {
        httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }

    return axios.create({
        baseURL: config.host,
        headers: {
            'Grpc-Metadata-macaroon': macaroon
        },
        httpsAgent,
        timeout: 30000
    });
}

/**
 * Execute via lncli if available (uses execFileSync to prevent shell injection)
 */
function lncliExec(args) {
    try {
        const result = execFileSync('lncli', args, {
            stdio: 'pipe',
            encoding: 'utf8',
            timeout: 30000
        });
        return JSON.parse(result);
    } catch (error) {
        throw new Error(`lncli error: ${error.stderr || error.message}`);
    }
}

/**
 * Get Lightning node info and balance
 */
async function getBalance() {
    try {
        console.log(chalk.bold.yellow('\n⚡ Lightning Network Balance'));
        console.log(chalk.gray('='.repeat(60)));

        const client = createLndClient();

        if (client) {
            // Use REST API
            console.log(chalk.gray('Connection:'), chalk.cyan('LND REST API'));

            try {
                const [info, walletBalance, channelBalance] = await Promise.all([
                    client.get('/v1/getinfo').then(r => r.data),
                    client.get('/v1/balance/blockchain').then(r => r.data),
                    client.get('/v1/balance/channels').then(r => r.data)
                ]);

                console.log(chalk.gray('\nNode:'), chalk.cyan(info.alias || 'unnamed'));
                console.log(chalk.gray('Pubkey:'), chalk.cyan(info.identity_pubkey));
                console.log(chalk.gray('Synced:'), info.synced_to_chain ? chalk.green('✓') : chalk.red('✗'));
                console.log(chalk.gray('Block Height:'), chalk.cyan(info.block_height));

                const onchainSats = parseInt(walletBalance.total_balance || 0);
                const channelSats = parseInt(channelBalance.balance || 0);
                const pendingSats = parseInt(channelBalance.pending_open_balance || 0);

                console.log(chalk.bold('\n💰 Balances'));
                console.log(chalk.gray('  On-chain:'), chalk.cyan(`${(onchainSats / 1e8).toFixed(8)} BTC (${onchainSats.toLocaleString()} sats)`));
                console.log(chalk.gray('  Channels:'), chalk.cyan(`${(channelSats / 1e8).toFixed(8)} BTC (${channelSats.toLocaleString()} sats)`));
                if (pendingSats > 0) {
                    console.log(chalk.gray('  Pending:'), chalk.yellow(`${pendingSats.toLocaleString()} sats`));
                }
                console.log(chalk.gray('  Total:'), chalk.cyan.bold(`${((onchainSats + channelSats) / 1e8).toFixed(8)} BTC`));

                console.log('');
            } catch (apiError) {
                throw new Error(`LND API error: ${apiError.response?.data?.message || apiError.message}`);
            }

        } else if (hasLncli()) {
            // Fallback to lncli
            console.log(chalk.gray('Connection:'), chalk.cyan('lncli'));

            const info = lncliExec(['getinfo']);
            const walletBalance = lncliExec(['walletbalance']);
            const channelBalance = lncliExec(['channelbalance']);

            console.log(chalk.gray('\nNode:'), chalk.cyan(info.alias || 'unnamed'));
            console.log(chalk.gray('Pubkey:'), chalk.cyan(info.identity_pubkey));
            console.log(chalk.gray('Synced:'), info.synced_to_chain ? chalk.green('✓') : chalk.red('✗'));

            const onchainSats = parseInt(walletBalance.total_balance || 0);
            const channelSats = parseInt(channelBalance.balance || 0);

            console.log(chalk.bold('\n💰 Balances'));
            console.log(chalk.gray('  On-chain:'), chalk.cyan(`${(onchainSats / 1e8).toFixed(8)} BTC (${onchainSats.toLocaleString()} sats)`));
            console.log(chalk.gray('  Channels:'), chalk.cyan(`${(channelSats / 1e8).toFixed(8)} BTC (${channelSats.toLocaleString()} sats)`));
            console.log(chalk.gray('  Total:'), chalk.cyan.bold(`${((onchainSats + channelSats) / 1e8).toFixed(8)} BTC`));

            console.log('');
        } else {
            console.log(chalk.yellow('\n⚠️  Lightning node not detected.'));
            console.log(chalk.gray('To use Lightning payments, you need:'));
            console.log(chalk.gray('  1. A running LND node'));
            console.log(chalk.gray('  2. Set LND_REST_HOST, LND_MACAROON_PATH, LND_TLS_CERT_PATH in .env'));
            console.log(chalk.gray('  OR install lncli on your PATH'));
            console.log(chalk.gray('\nQuick setup: https://github.com/lightninglabs/lightning-agent-tools'));
            console.log('');
        }

    } catch (error) {
        handleError(error, 'Lightning Balance');
        process.exit(1);
    }
}

/**
 * Decode a BOLT11 Lightning invoice
 */
async function decodeInvoice(invoice) {
    const client = createLndClient();

    if (client) {
        // Sanitize invoice: strip any non-alphanumeric characters except valid BOLT11 chars
        const safeInvoice = invoice.replace(/[^a-zA-Z0-9]/g, '');
        const response = await client.get(`/v1/payreq/${safeInvoice}`);
        return response.data;
    } else if (hasLncli()) {
        return lncliExec(['decodepayreq', invoice]);
    } else {
        throw new Error('No LND connection available. Configure LND_REST_HOST or install lncli.');
    }
}

/**
 * Pay a BOLT11 Lightning invoice
 * @param {string} invoice - BOLT11 encoded payment request
 * @param {number} maxSats - Maximum sats to pay (safety limit)
 */
async function payInvoice(invoice, maxSats = 100000) {
    try {
        if (!invoice) {
            throw new ValidationError('Lightning invoice (payment request) is required');
        }

        // Basic BOLT11 validation
        const lowerInvoice = invoice.toLowerCase();
        if (!lowerInvoice.startsWith('lnbc') && !lowerInvoice.startsWith('lntb') && !lowerInvoice.startsWith('lnbcrt')) {
            throw new ValidationError(
                'Invalid Lightning invoice. Must start with "lnbc" (mainnet), "lntb" (testnet), or "lnbcrt" (regtest).'
            );
        }

        console.log(chalk.bold.yellow('\n⚡ Paying Lightning Invoice'));
        console.log(chalk.gray('='.repeat(60)));

        // Decode invoice first
        console.log(chalk.yellow('⏳ Decoding invoice...'));
        const decoded = await decodeInvoice(invoice);

        const amountSats = parseInt(decoded.num_satoshis || 0);
        const description = decoded.description || 'No description';
        const destination = decoded.destination || 'unknown';
        const expiry = decoded.expiry || 3600;

        console.log(chalk.gray('Amount:'), chalk.cyan(`${amountSats.toLocaleString()} sats (${(amountSats / 1e8).toFixed(8)} BTC)`));
        console.log(chalk.gray('Description:'), chalk.cyan(description));
        console.log(chalk.gray('Destination:'), chalk.cyan(destination.substring(0, 20) + '...'));
        console.log(chalk.gray('Expiry:'), chalk.cyan(`${expiry}s`));

        // Safety check
        if (amountSats > maxSats) {
            throw new Error(
                `Invoice amount (${amountSats.toLocaleString()} sats) exceeds safety limit (${maxSats.toLocaleString()} sats). ` +
                `Increase maxSats if this is intentional.`
            );
        }

        if (amountSats === 0) {
            throw new Error('Zero-amount invoices are not supported for safety. Use a specific amount.');
        }

        // Pay invoice
        console.log(chalk.yellow('\n⏳ Sending payment...'));

        const client = createLndClient();
        let result;

        if (client) {
            const response = await client.post('/v1/channels/transactions', {
                payment_request: invoice,
                timeout_seconds: 60,
                fee_limit: { fixed: Math.floor(amountSats * 0.01) } // 1% max fee
            });
            result = response.data;
        } else if (hasLncli()) {
            result = lncliExec(['payinvoice', '--force', '--json', invoice]);
        } else {
            throw new Error('No LND connection available. Configure LND_REST_HOST or install lncli.');
        }

        if (result.payment_error) {
            throw new Error(`Payment failed: ${result.payment_error}`);
        }

        console.log(chalk.green('\n✨ Lightning payment successful!'));
        console.log(chalk.gray('Payment hash:'), chalk.cyan(result.payment_hash || 'N/A'));
        console.log(chalk.gray('Amount paid:'), chalk.cyan(`${amountSats.toLocaleString()} sats`));
        if (result.payment_route?.total_fees) {
            console.log(chalk.gray('Routing fee:'), chalk.cyan(`${result.payment_route.total_fees} sats`));
        }
        console.log('');

        return result;

    } catch (error) {
        if (error instanceof ValidationError) {
            displayValidationError(error, 'lightning-pay');
            process.exit(1);
        }
        handleError(error, 'Lightning Payment');
        process.exit(1);
    }
}

/**
 * Make an L402 HTTP request using lnget
 * Automatically pays Lightning invoices for API access
 * @param {string} url - URL to fetch
 * @param {number} maxCost - Maximum sats to pay
 */
async function lnget(url, maxCost = 500) {
    try {
        if (!url) {
            throw new ValidationError('URL is required for lnget');
        }

        console.log(chalk.bold.yellow('\n⚡ L402 Request (lnget)'));
        console.log(chalk.gray('='.repeat(60)));
        console.log(chalk.gray('URL:'), chalk.cyan(url));
        console.log(chalk.gray('Max cost:'), chalk.cyan(`${maxCost} sats`));

        if (!hasLnget()) {
            console.log(chalk.yellow('\n⚠️  lnget not found on PATH.'));
            console.log(chalk.gray('Install via: go install github.com/lightninglabs/lightning-agent-tools/cmd/lnget@latest'));
            console.log(chalk.gray('Or:  npx -y @lightninglabs/lightning-mcp-server'));
            console.log('');
            return null;
        }

        console.log(chalk.yellow('\n⏳ Fetching resource...'));

        // Validate URL to prevent injection
        try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                throw new Error('Only http and https URLs are supported');
            }
        } catch (urlError) {
            throw new ValidationError(`Invalid URL: ${urlError.message}`);
        }

        const result = execFileSync('lnget', ['--max-cost', String(maxCost), url], {
            stdio: 'pipe',
            encoding: 'utf8',
            timeout: 30000
        });

        console.log(chalk.green('✓ Resource fetched'));
        console.log(chalk.gray('\n--- Response ---'));
        console.log(result);
        console.log(chalk.gray('--- End ---\n'));

        return result;

    } catch (error) {
        if (error instanceof ValidationError) {
            displayValidationError(error, 'lightning-lnget');
            process.exit(1);
        }
        handleError(error, 'L402 Request');
        process.exit(1);
    }
}

// CLI Execution
if (require.main === module) {
    const command = process.argv[2];

    switch (command) {
        case 'pay': {
            const invoice = process.argv[3];
            const maxSats = parseInt(process.argv[4]) || 100000;
            if (!invoice) {
                console.log(chalk.red('\n❌ Usage: npm run lightning-pay pay <bolt11_invoice> [max_sats]'));
                console.log(chalk.gray('Example: npm run lightning-pay pay lnbc10u1p... 50000\n'));
                process.exit(1);
            }
            payInvoice(invoice, maxSats);
            break;
        }

        case 'balance':
            getBalance();
            break;

        case 'decode': {
            const inv = process.argv[3];
            if (!inv) {
                console.log(chalk.red('\n❌ Usage: npm run lightning-pay decode <bolt11_invoice>'));
                process.exit(1);
            }
            decodeInvoice(inv).then(decoded => {
                console.log(chalk.bold.yellow('\n⚡ Invoice Details'));
                console.log(chalk.gray('='.repeat(60)));
                console.log(JSON.stringify(decoded, null, 2));
                console.log('');
            }).catch(err => {
                handleError(err, 'Invoice Decode');
                process.exit(1);
            });
            break;
        }

        case 'lnget': {
            const url = process.argv[3];
            const maxCost = parseInt(process.argv[4]) || 500;
            if (!url) {
                console.log(chalk.red('\n❌ Usage: npm run lightning-pay lnget <url> [max_sats]'));
                console.log(chalk.gray('Example: npm run lightning-pay lnget https://api.example.com/data 500\n'));
                process.exit(1);
            }
            lnget(url, maxCost);
            break;
        }

        default:
            console.log(chalk.bold.yellow('\n⚡ Lightning Agent Tools'));
            console.log(chalk.gray('='.repeat(60)));
            console.log(chalk.cyan('\nCommands:'));
            console.log(chalk.gray('  npm run lightning-pay pay <invoice> [max_sats]  — Pay a BOLT11 invoice'));
            console.log(chalk.gray('  npm run lightning-pay balance                   — Check node balance'));
            console.log(chalk.gray('  npm run lightning-pay decode <invoice>          — Decode an invoice'));
            console.log(chalk.gray('  npm run lightning-pay lnget <url> [max_sats]   — L402 HTTP request'));
            console.log(chalk.gray('\nSetup: https://github.com/lightninglabs/lightning-agent-tools'));
            console.log('');
    }
}

module.exports = { payInvoice, getBalance, decodeInvoice, lnget };
