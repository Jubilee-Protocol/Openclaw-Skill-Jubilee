#!/usr/bin/env node
// lib/stacks-swarm.js
// Submit goals to the NoCodeClarityAI orchestrator and stream results.
// This is the "Option 2" integration — OpenClaw as the interface,
// NoCodeClarityAI as the execution engine.

require('dotenv').config();
const chalk = require('chalk');

const ORCHESTRATOR = process.env.NOCODECLARITY_URL || 'http://localhost:3001';
const SECRET = process.env.ORCHESTRATOR_SECRET || '';

async function apiCall(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-orchestrator-secret': SECRET,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${ORCHESTRATOR}${path}`, opts);
  return res.json();
}

// ── Commands ─────────────────────────────────────────────────────────────────

async function health() {
  const data = await apiCall('GET', '/health');
  const ok = data.status === 'ok';
  console.log(chalk.bold('\n🤖 NoCodeClarity AI Status\n'));
  console.log(`  Orchestrator:  ${ok ? chalk.green('ONLINE') : chalk.red('OFFLINE')}`);
  console.log(`  URL:           ${chalk.gray(ORCHESTRATOR)}\n`);
}

async function listStrategies() {
  const data = await apiCall('GET', '/strategies');
  console.log(chalk.bold('\n📋 Active Strategies\n'));
  if (!data.strategies?.length) {
    console.log(chalk.gray('  No strategies configured. Create one first.\n'));
    return;
  }
  for (const s of data.strategies) {
    console.log(`  ${chalk.cyan(s.name)} ${chalk.gray(`(${s.id})`)}`);
    console.log(`    Template: ${s.template}  Mode: ${s.mode}  Active: ${s.active ? chalk.green('✓') : chalk.red('✗')}`);
  }
  console.log();
}

async function listTasks() {
  const data = await apiCall('GET', '/tasks');
  console.log(chalk.bold('\n📝 Recent Tasks\n'));
  if (!data.tasks?.length) {
    console.log(chalk.gray('  No tasks yet. Submit a goal to get started.\n'));
    return;
  }
  const statusColors = {
    complete: 'green', rejected: 'red', failed: 'red',
    pending: 'gray', analyzing: 'blue', gating: 'yellow',
    needs_human: 'magenta', executing: 'cyan', confirming: 'cyan',
    held: 'gray',
  };
  for (const t of data.tasks.slice(0, 10)) {
    const color = statusColors[t.status] || 'white';
    console.log(`  ${chalk[color](`[${t.status.toUpperCase()}]`)} ${chalk.white(t.goal)}`);
    if (t.txid) console.log(`    ${chalk.gray('txid:')} ${chalk.yellow(t.txid)}`);
  }
  console.log();
}

async function submitGoal(goal, strategyId) {
  if (!goal) {
    console.log(chalk.red('\nUsage: npm run stacks-swarm goal "<your goal>" <strategy_id>\n'));
    console.log(chalk.gray('Examples:'));
    console.log(chalk.gray('  npm run stacks-swarm goal "deposit my sBTC for yield" abc-123'));
    console.log(chalk.gray('  npm run stacks-swarm goal "stack my STX for 2 cycles" abc-123'));
    console.log(chalk.gray('  npm run stacks-swarm goal "swap 10 STX for sBTC" abc-123\n'));
    process.exit(1);
  }
  if (!strategyId) {
    console.log(chalk.red('\nStrategy ID required. Run: npm run stacks-swarm strategies\n'));
    process.exit(1);
  }

  console.log(chalk.bold('\n🚀 Submitting Goal\n'));
  console.log(`  Goal:     ${chalk.white(goal)}`);
  console.log(`  Strategy: ${chalk.gray(strategyId)}\n`);

  const data = await apiCall('POST', '/tasks', { goal, strategyId });

  if (data.error) {
    console.log(chalk.red(`  Error: ${data.error}\n`));
    process.exit(1);
  }

  console.log(chalk.green(`  ✓ Task created: ${data.task?.id}`));
  console.log(chalk.gray(`  Status: ${data.task?.status}`));
  console.log(chalk.gray(`\n  Monitor: npm run stacks-swarm tasks\n`));
}

async function approve(taskId) {
  if (!taskId) {
    console.log(chalk.red('\nUsage: npm run stacks-swarm approve <task_id>\n'));
    process.exit(1);
  }
  const data = await apiCall('POST', `/tasks/${taskId}/approve`);
  if (data.approved) {
    console.log(chalk.green(`\n  ✓ Task ${taskId} approved\n`));
  } else {
    console.log(chalk.red(`\n  ✗ ${data.error}\n`));
  }
}

async function reject(taskId) {
  if (!taskId) {
    console.log(chalk.red('\nUsage: npm run stacks-swarm reject <task_id>\n'));
    process.exit(1);
  }
  const data = await apiCall('POST', `/tasks/${taskId}/reject`);
  if (data.rejected) {
    console.log(chalk.green(`\n  ✓ Task ${taskId} rejected\n`));
  } else {
    console.log(chalk.red(`\n  ✗ ${data.error}\n`));
  }
}

async function pause() {
  const data = await apiCall('POST', '/pause');
  if (data.paused) {
    console.log(chalk.red('\n  ⏸  All tasks paused (kill switch activated)\n'));
  } else {
    console.log(chalk.red('\n  ✗ Pause failed\n'));
  }
}

// ── CLI Router ───────────────────────────────────────────────────────────────

async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'health':
    case 'status':
      return health();
    case 'strategies':
      return listStrategies();
    case 'tasks':
      return listTasks();
    case 'goal':
    case 'submit':
      return submitGoal(args[0], args[1]);
    case 'approve':
      return approve(args[0]);
    case 'reject':
      return reject(args[0]);
    case 'pause':
    case 'kill':
      return pause();
    default:
      console.log(chalk.bold('\n🤖 NoCodeClarity AI — Stacks Agent Swarm\n'));
      console.log('  Commands:');
      console.log(`    ${chalk.cyan('health')}       Check orchestrator status`);
      console.log(`    ${chalk.cyan('strategies')}   List active strategies`);
      console.log(`    ${chalk.cyan('tasks')}        List recent tasks`);
      console.log(`    ${chalk.cyan('goal')}         Submit a new goal`);
      console.log(`    ${chalk.cyan('approve')}      Approve a NEEDS_HUMAN task`);
      console.log(`    ${chalk.cyan('reject')}       Reject a NEEDS_HUMAN task`);
      console.log(`    ${chalk.cyan('pause')}        Kill switch — halt all tasks`);
      console.log();
  }
}

main().catch(err => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});
