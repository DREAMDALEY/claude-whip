import { execa } from 'execa';

export async function detectClaude(): Promise<string | null> {
  try {
    const { stdout } = await execa('claude', ['--version']);
    return stdout.trim();
  } catch {
    return null;
  }
}

export function buildClaudeArgs(prompt: string, opts: {
  budget?: number;
  model?: string;
  cwd?: string;
}): string[] {
  const args = [
    '-p',
    '--output-format', 'json',
    '--verbose',
    '--dangerously-skip-permissions',
  ];

  if (opts.budget) {
    args.push('--max-budget-usd', String(opts.budget));
  }

  if (opts.model) {
    args.push('--model', opts.model);
  }

  args.push(prompt);
  return args;
}

export interface ClaudeResult {
  result: string;
  cost: number;
  duration: number;
  turns: number;
}

export async function runClaude(prompt: string, opts: {
  budget?: number;
  model?: string;
  cwd?: string;
}): Promise<ClaudeResult> {
  const args = buildClaudeArgs(prompt, opts);

  const { stdout } = await execa('claude', args, {
    cwd: opts.cwd,
    timeout: 600_000,
  });

  try {
    const parsed = JSON.parse(stdout);
    return {
      result: parsed.result || stdout,
      cost: parsed.total_cost_usd || 0,
      duration: parsed.duration_ms || 0,
      turns: parsed.num_turns || 1,
    };
  } catch {
    return { result: stdout, cost: 0, duration: 0, turns: 1 };
  }
}
