#!/usr/bin/env node
// lib/uniswap-swap.js
// Execute token swaps via Uniswap on Ethereum and Base

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

// Uniswap Permit2 address (same on all chains)
const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

// Uniswap Universal Router addresses
const UNIVERSAL_ROUTER = {
    ethereum: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
    base: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD'
};

// Uniswap Quoter V2 addresses
const QUOTER_V2 = {
    ethereum: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    base: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a'
};

// QuoterV2 ABI (minimal)
const QUOTER_ABI = [
    'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)'
];

// Swap Router 02 ABI (minimal for exactInputSingle)
const SWAP_ROUTER_ABI = [
    'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'
];

// Uniswap SwapRouter02 addresses (fallback for simpler swaps)
const SWAP_ROUTER_02 = {
    ethereum: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    base: '0x2626664c2603336E57B271c5C0b26F421741e481'
};

/**
 * Get token decimals dynamically
 */
async function getTokenDecimals(tokenAddress, provider) {
    if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        return 18;
    }
    const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function decimals() view returns (uint8)'],
        provider
    );
    return await tokenContract.decimals();
}

/**
 * Get token symbol dynamically
 */
async function getTokenSymbol(tokenAddress, provider) {
    if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        return 'ETH';
    }
    const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function symbol() view returns (string)'],
        provider
    );
    return await tokenContract.symbol();
}

/**
 * Resolve WETH address for native ETH swaps on Uniswap
 */
function resolveTokenForUniswap(tokenAddress, chain) {
    if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        // Uniswap uses WETH internally
        return config.assets[chain]?.WETH || '0x4200000000000000000000000000000000000006';
    }
    return tokenAddress;
}

/**
 * Get Uniswap quote using QuoterV2
 */
async function getUniswapQuote(tokenIn, tokenOut, amountIn, chain, provider) {
    const quoterAddress = QUOTER_V2[chain];
    if (!quoterAddress) {
        throw new Error(`Uniswap Quoter not configured for chain: ${chain}`);
    }

    const quoter = new ethers.Contract(quoterAddress, QUOTER_ABI, provider);

    // Try common fee tiers: 0.3%, 0.05%, 1%, 0.01%
    const feeTiers = [3000, 500, 10000, 100];
    let bestQuote = null;
    let bestFee = null;

    for (const fee of feeTiers) {
        try {
            const result = await quoter.quoteExactInputSingle.staticCall({
                tokenIn,
                tokenOut,
                amountIn,
                fee,
                sqrtPriceLimitX96: 0n
            });

            const amountOut = result[0];
            const gasEstimate = result[3];

            if (!bestQuote || amountOut > bestQuote.amountOut) {
                bestQuote = { amountOut, gasEstimate };
                bestFee = fee;
            }
        } catch {
            // Fee tier not available for this pair, try next
            continue;
        }
    }

    if (!bestQuote) {
        throw new Error('No Uniswap liquidity found for this token pair. Try a different pair or use npm run swap for 0x routing.');
    }

    return { ...bestQuote, fee: bestFee };
}

/**
 * Ensure token approval for SwapRouter02
 */
async function ensureRouterApproval(wallet, tokenAddress, routerAddress, amount, decimals) {
    console.log(chalk.yellow('\n⏳ Checking SwapRouter allowance...'));

    const tokenContract = new ethers.Contract(
        tokenAddress,
        [
            'function allowance(address owner, address spender) view returns (uint256)',
            'function approve(address spender, uint256 amount) returns (bool)'
        ],
        wallet
    );

    const currentAllowance = await tokenContract.allowance(wallet.address, routerAddress);

    if (currentAllowance >= amount) {
        console.log(chalk.green('✓ Sufficient allowance'));
        return;
    }

    console.log(chalk.yellow('⏳ Approving Uniswap SwapRouter...'));
    const approveTx = await tokenContract.approve(routerAddress, ethers.MaxUint256);
    console.log(chalk.gray('Approval tx:'), chalk.cyan(approveTx.hash));
    await approveTx.wait();
    console.log(chalk.green('✓ SwapRouter approved'));
}

/**
 * Execute token swap via Uniswap
 * @param {string} amount - Amount to swap
 * @param {string} fromSymbol - Source token symbol
 * @param {string} toSymbol - Destination token symbol
 * @param {string} chain - Network to use (ethereum or base)
 */
async function uniswapSwap(amount, fromSymbol, toSymbol, chain = 'base') {
    try {
        // Validate inputs
        validateAmount(amount, 'Swap amount');

        const validAssets = chain === 'ethereum'
            ? ['ETH', 'WETH', 'USDC', 'USDT', 'WBTC', 'DAI']
            : ['ETH', 'WETH', 'USDC', 'USDT', 'cbBTC', 'WBTC', 'DAI'];

        const validFromSymbol = validateAsset(fromSymbol.toUpperCase(), validAssets);
        const validToSymbol = validateAsset(toSymbol.toUpperCase(), validAssets);

        if (!['ethereum', 'base'].includes(chain)) {
            throw new ValidationError(`Uniswap swap only supports "ethereum" and "base" chains. Got: "${chain}"`);
        }

        if (validFromSymbol === validToSymbol) {
            throw new ValidationError('Cannot swap a token to itself');
        }

        console.log(chalk.bold.magenta('\n🦄 Executing Uniswap Swap'));
        console.log(chalk.gray('='.repeat(60)));

        // Setup
        const wallet = loadWallet();
        const provider = getProvider(chain, config);
        const connectedWallet = wallet.connect(provider);

        // Get token addresses
        const fromToken = config.assets[chain]?.[validFromSymbol];
        const toToken = config.assets[chain]?.[validToSymbol];

        if (!fromToken || !toToken) {
            throw new Error(`Token not configured for ${chain}. Check config.js assets.${chain}`);
        }

        console.log(chalk.gray('From:'), chalk.cyan(`${amount} ${validFromSymbol}`));
        console.log(chalk.gray('To:'), chalk.cyan(validToSymbol));
        console.log(chalk.gray('Router:'), chalk.cyan('Uniswap V3'));
        console.log(chalk.gray('Network:'), chalk.cyan(chain.toUpperCase()));
        console.log(chalk.gray('Trader:'), chalk.cyan(wallet.address));

        const isFromETH = validFromSymbol === 'ETH';
        const isToETH = validToSymbol === 'ETH';

        // Resolve to WETH for Uniswap
        const uniFromToken = resolveTokenForUniswap(fromToken, chain);
        const uniToToken = resolveTokenForUniswap(toToken, chain);

        // Get token decimals
        const fromDecimals = await getTokenDecimals(fromToken, provider);
        const toDecimals = await getTokenDecimals(toToken, provider);

        const sellAmount = parseAmount(amount, fromDecimals);

        // Check balance
        console.log(chalk.yellow('\n⏳ Checking balance...'));
        let balance;
        if (isFromETH) {
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

        // Get quote
        console.log(chalk.yellow('\n⏳ Fetching Uniswap quote...'));
        const quote = await getUniswapQuote(uniFromToken, uniToToken, sellAmount, chain, provider);

        const expectedOut = formatAmount(quote.amountOut, toDecimals);
        const feeLabel = (quote.fee / 10000).toFixed(2);

        console.log(chalk.green('✓ Quote received'));
        console.log(chalk.gray('  Expected output:'), chalk.cyan(`${expectedOut} ${validToSymbol}`));
        console.log(chalk.gray('  Pool fee tier:'), chalk.cyan(`${feeLabel}%`));
        console.log(chalk.gray('  Est. gas:'), chalk.cyan(quote.gasEstimate.toString()));

        // Apply 1% slippage tolerance
        const minAmountOut = (quote.amountOut * 99n) / 100n;

        // Approve if not ETH
        const routerAddress = SWAP_ROUTER_02[chain];
        if (!isFromETH) {
            await ensureRouterApproval(connectedWallet, fromToken, routerAddress, sellAmount, fromDecimals);
        }

        // Build swap transaction
        console.log(chalk.yellow('\n⏳ Executing Uniswap swap...'));

        const swapRouter = new ethers.Contract(routerAddress, SWAP_ROUTER_ABI, connectedWallet);

        const swapParams = {
            tokenIn: uniFromToken,
            tokenOut: uniToToken,
            fee: quote.fee,
            recipient: isToETH ? routerAddress : wallet.address, // If to ETH, router unwraps
            amountIn: sellAmount,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0n
        };

        const txOverrides = {};
        if (isFromETH) {
            txOverrides.value = sellAmount;
        }

        // Estimate gas first
        try {
            await swapRouter.exactInputSingle.estimateGas(swapParams, txOverrides);
        } catch (estimateError) {
            throw new Error(
                'Uniswap transaction would likely fail. Check token balances and liquidity. ' +
                `Details: ${estimateError.message}`
            );
        }

        const txResponse = await swapRouter.exactInputSingle(swapParams, txOverrides);
        console.log(chalk.gray('Transaction sent:'), chalk.cyan(txResponse.hash));

        const receipt = await txResponse.wait();
        displayTxResult(receipt, 'Uniswap Swap');

        // Display final balances
        console.log(chalk.green('\n✨ Uniswap swap completed successfully!'));

        if (isToETH) {
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

        const explorer = chain === 'ethereum' ? 'etherscan.io' : 'basescan.org';
        console.log(chalk.gray('\nView on explorer:'), chalk.cyan(`https://${explorer}/tx/${txResponse.hash}\n`));

    } catch (error) {
        if (error instanceof ValidationError) {
            displayValidationError(error, 'uniswap-swap');
            process.exit(1);
        }
        handleError(error, 'Uniswap Swap');
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
        console.log(chalk.red('\n❌ Usage: npm run uniswap-swap <amount> <fromToken> <toToken> [chain]'));
        console.log(chalk.gray('Example: npm run uniswap-swap 0.01 ETH USDC base'));
        console.log(chalk.gray('Example: npm run uniswap-swap 100 USDC WETH ethereum'));
        console.log(chalk.gray('Chains:  ethereum, base\n'));
        process.exit(1);
    }

    uniswapSwap(amount, fromSymbol, toSymbol, chain);
}

module.exports = { uniswapSwap };
