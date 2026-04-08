import { execa, type ResultPromise } from 'execa';
import { agentId } from '../utils/id.js';

export interface SubTask {
  id: string;
  description: string;
  files_hint?: string[];
}

export type AgentStatus = 'pending' | 'running' | 'done' | 'error';

export interface Agent {
  id: string;
  slug: string;
  task: string;
  status: AgentStatus;
  worktreePath: string | null;
  result: string | null;
  error: string | null;
  cost: number;
  duration: number;
  filesChanged: string[];
  process: ResultPromise | null;
  startedAt: number | null;
}

export function createAgent(subtask: SubTask, worktreePath: string | null): Agent {
  return {
    id: agentId(),
    slug: subtask.id,
    task: subtask.description,
    status: 'pending',
    worktreePath,
    result: null,
    error: null,
    cost: 0,
    duration: 0,
    filesChanged: [],
    process: null,
    startedAt: null,
  };
}

export async function runAgent(agent: Agent, opts: {
  budget: number;
  model: string;
}): Promise<Agent> {
  agent.status = 'running';
  agent.startedAt = Date.now();

  const prompt = `You are a specialized agent. Your ONLY job is:
${agent.task}

You are working in a git worktree. Make your changes directly to the files.
Do NOT work on anything outside your assigned scope.
Be concise and efficient. Do the work, don't explain it.`;

  const args = [
    '-p',
    '--output-format', 'json',
    '--verbose',
    '--dangerously-skip-permissions',
    '--max-budget-usd', String(opts.budget),
    '--model', opts.model,
    prompt,
  ];

  try {
    const proc = execa('claude', args, {
      cwd: agent.worktreePath || process.cwd(),
      timeout: 600_000,
    });

    agent.process = proc;
    const { stdout } = await proc;

    try {
      const parsed = JSON.parse(stdout);
      agent.result = parsed.result || stdout;
      agent.cost = parsed.total_cost_usd || 0;
      agent.duration = parsed.duration_ms || 0;
    } catch {
      agent.result = stdout;
    }

    agent.status = 'done';
  } catch (err: any) {
    agent.status = 'error';
    agent.error = err.message || 'Agent failed';
    agent.result = err.stdout || null;
  }

  if (!agent.duration && agent.startedAt) {
    agent.duration = Date.now() - agent.startedAt;
  }

  return agent;
}
