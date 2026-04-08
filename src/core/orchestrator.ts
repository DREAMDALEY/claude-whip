import { decompose } from './decomposer.js';
import { createAgent, runAgent, type Agent, type SubTask } from './agent.js';
import { mergeAgents, type MergeResult } from './merger.js';
import { createWorktree, removeWorktree, isGitRepo, getRepoRoot } from '../utils/git.js';

export interface WhipState {
  task: string;
  whipLevel: number;
  agents: Agent[];
  status: 'idle' | 'decomposing' | 'running' | 'merging' | 'done' | 'error';
  totalCost: number;
  startedAt: number;
  repoRoot: string | null;
  isGit: boolean;
  mergeResult: MergeResult | null;
}

export type StateListener = (state: WhipState) => void;

export class Orchestrator {
  private state: WhipState;
  private listeners: StateListener[] = [];
  private model: string;
  private agentBudget: number;
  private maxConcurrent: number;

  constructor(opts: {
    task: string;
    whipLevel: number;
    model: string;
    agentBudget: number;
    maxConcurrent?: number;
  }) {
    this.model = opts.model;
    this.agentBudget = opts.agentBudget;
    this.maxConcurrent = opts.maxConcurrent || 5;

    this.state = {
      task: opts.task,
      whipLevel: opts.whipLevel,
      agents: [],
      status: 'idle',
      totalCost: 0,
      startedAt: Date.now(),
      repoRoot: null,
      isGit: false,
      mergeResult: null,
    };
  }

  onStateChange(listener: StateListener) {
    this.listeners.push(listener);
  }

  private emit() {
    this.state.totalCost = this.state.agents.reduce((sum, a) => sum + a.cost, 0);
    for (const fn of this.listeners) fn({ ...this.state });
  }

  getState(): WhipState {
    return { ...this.state };
  }

  async whip() {
    this.state.whipLevel++;
    if (this.state.status === 'running') return; // can't whip while running
    await this.run();
  }

  async run() {
    // Detect git
    const cwd = process.cwd();
    this.state.isGit = await isGitRepo(cwd);
    if (this.state.isGit) {
      this.state.repoRoot = await getRepoRoot(cwd);
    }

    if (this.state.whipLevel <= 1) {
      // Single agent mode
      this.state.status = 'running';
      const agent = createAgent(
        { id: 'main', description: this.state.task },
        this.state.isGit ? this.state.repoRoot : null
      );
      this.state.agents = [agent];
      this.emit();

      await runAgent(agent, { budget: this.agentBudget, model: this.model });
      this.state.status = 'done';
      this.emit();
      return;
    }

    // Decompose
    this.state.status = 'decomposing';
    this.emit();

    const subtasks = await decompose(this.state.task, this.state.whipLevel + 1, this.model);

    // Create agents with worktrees
    const agents: Agent[] = [];
    for (const subtask of subtasks) {
      let worktreePath: string | null = null;
      if (this.state.isGit && this.state.repoRoot) {
        try {
          worktreePath = await createWorktree(this.state.repoRoot, subtask.id);
        } catch {
          worktreePath = this.state.repoRoot;
        }
      }
      agents.push(createAgent(subtask, worktreePath));
    }

    this.state.agents = agents;
    this.state.status = 'running';
    this.emit();

    // Run agents in parallel (capped at maxConcurrent)
    const running: Promise<Agent>[] = [];
    const queue = [...agents];

    const runNext = async () => {
      while (queue.length > 0 && running.length < this.maxConcurrent) {
        const agent = queue.shift()!;
        const promise = runAgent(agent, {
          budget: this.agentBudget,
          model: this.model,
        }).then(a => {
          this.emit();
          return a;
        });
        running.push(promise);
      }
    };

    await runNext();
    await Promise.all(running);

    // Merge results
    if (this.state.isGit && this.state.repoRoot) {
      this.state.status = 'merging';
      this.emit();

      this.state.mergeResult = await mergeAgents(agents, this.state.repoRoot);
    }

    // Cleanup worktrees
    for (const agent of agents) {
      if (agent.worktreePath && agent.worktreePath !== this.state.repoRoot) {
        await removeWorktree(agent.worktreePath);
      }
    }

    this.state.status = 'done';
    this.emit();
  }
}
