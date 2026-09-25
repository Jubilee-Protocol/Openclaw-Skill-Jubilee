#!/usr/bin/env node
/**
 * index.js — single entrypoint for the Jubilee OpenClaw Skill.
 *
 * `package.json` declares `main: index.js`; this is that entrypoint. It simply
 * routes to the per-command scripts under lib/ so the skill works both as
 * `npm run <command>` and as `node index.js <command> [args...]`.
 *
 * No dependencies — safe to run before `npm install`.
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const COMMANDS = {
  status: 'Vault stats (TVL, APY)',
  balance: 'Treasury balance across vaults',
  deposit: 'Deposit into a Jubilee vault',
  withdraw: 'Withdraw from a Jubilee vault',
  donate: 'Donate harvested yield',
  'war-room': "Steward's report",
  swap: '0x swap (Base)',
  'uniswap-swap': 'Uniswap V3 swap (Ethereum/Base)',
  'jupiter-swap': 'Jupiter swap (Solana)',
  'lightning-pay': 'Lightning / L402 payments (Bitcoin)',
};

const [, , cmd, ...args] = process.argv;

if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
  const lines = Object.entries(COMMANDS).map(([k, v]) => `  ${k.padEnd(16)} ${v}`);
  process.stdout.write(
    [
      'Jubilee Protocol — agent treasury toolkit',
      '',
      'Usage: node index.js <command> [args...]',
      '',
      'Commands:',
      ...lines,
      '',
      'Examples:',
      '  node index.js status base',
      '  node index.js balance base',
      '  node index.js deposit 100 USDC base',
      '',
    ].join('\n'),
  );
  process.exit(0);
}

const target = path.join(__dirname, 'lib', `${cmd}.js`);
if (!COMMANDS[cmd]) {
  process.stderr.write(`Unknown command: ${cmd}\nRun \`node index.js help\` for the list.\n`);
  process.exit(1);
}

const res = spawnSync(process.execPath, [target, ...args], { stdio: 'inherit' });
process.exit(res.status === null ? 1 : res.status);
