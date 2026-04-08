import type { Agent } from './agent.js';
import { commitWorktree, cherryPick, getChangedFiles } from '../utils/git.js';

export interface MergeResult {
  success: boolean;
  merged: string[];
  conflicts: string[];
  totalFiles: number;
}

export async function mergeAgents(agents: Agent[], repoRoot: string): Promise<MergeResult> {
  const merged: string[] = [];
  const conflicts: string[] = [];
  let totalFiles = 0;

  const doneAgents = agents.filter(a => a.status === 'done' && a.worktreePath);

  for (const agent of doneAgents) {
    if (!agent.worktreePath) continue;

    const files = await getChangedFiles(agent.worktreePath);
    agent.filesChanged = files;
    totalFiles += files.length;

    if (files.length === 0) {
      merged.push(agent.slug);
      continue;
    }

    const sha = await commitWorktree(
      agent.worktreePath,
      `claude-whip: ${agent.slug} - ${agent.task.substring(0, 60)}`
    );

    if (!sha) {
      merged.push(agent.slug);
      continue;
    }

    const ok = await cherryPick(repoRoot, sha);
    if (ok) {
      merged.push(agent.slug);
    } else {
      conflicts.push(agent.slug);
    }
  }

  return {
    success: conflicts.length === 0,
    merged,
    conflicts,
    totalFiles,
  };
}
