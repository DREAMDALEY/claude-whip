import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import chalk from 'chalk';
import { App } from './app.js';
import { detectClaude } from './utils/claude-cli.js';

const program = new Command();

program
  .name('claude-whip')
  .description('Crack the whip on Claude Code - parallel agent orchestration')
  .version('0.1.0')
  .argument('<task>', 'The task to accomplish (quoted string)')
  .option('-w, --whip <level>', 'Initial whip level', '1')
  .option('-m, --model <model>', 'Claude model to use', 'sonnet')
  .option('--budget <dollars>', 'Max total budget in USD', '5.00')
  .option('--agent-budget <dollars>', 'Max budget per agent in USD', '1.00')
  .option('--dry-run', 'Show decomposition plan without executing', false)
  .action(async (task: string, opts: any) => {
    // Check Claude CLI
    const version = await detectClaude();
    if (!version) {
      console.error(chalk.red('\n  Claude Code CLI not found.'));
      console.error(chalk.gray('  Install it: npm install -g @anthropic-ai/claude-code'));
      console.error(chalk.gray('  Or visit: https://claude.ai/claude-code\n'));
      process.exit(1);
    }

    console.log(chalk.gray(`  Claude CLI: ${version}`));

    const whipLevel = parseInt(opts.whip, 10);
    const budget = parseFloat(opts.budget);
    const agentBudget = parseFloat(opts.agentBudget);

    if (whipLevel < 1) {
      console.error(chalk.red('  Whip level must be at least 1'));
      process.exit(1);
    }

    console.log('');
    console.log(chalk.red.bold('  🔥 claude-whip'));
    console.log(chalk.gray(`  Task: ${task}`));
    console.log(chalk.gray(`  Whip level: ${whipLevel} | Model: ${opts.model} | Budget: $${budget}`));
    console.log('');

    const { waitUntilExit } = render(
      <App
        task={task}
        whipLevel={whipLevel}
        model={opts.model}
        agentBudget={agentBudget}
        totalBudget={budget}
        dryRun={opts.dryRun}
      />
    );

    await waitUntilExit();
  });

program.parse();
