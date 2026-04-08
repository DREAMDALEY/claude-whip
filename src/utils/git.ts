import { execa } from 'execa';
import path from 'path';
import { nanoid } from 'nanoid';

export async function isGitRepo(dir: string): Promise<boolean> {
  try {
    await execa('git', ['rev-parse', '--git-dir'], { cwd: dir });
    return true;
  } catch {
    return false;
  }
}

export async function getRepoRoot(dir: string): Promise<string> {
  const { stdout } = await execa('git', ['rev-parse', '--show-toplevel'], { cwd: dir });
  return stdout.trim();
}

export async function createWorktree(repoRoot: string, agentId: string): Promise<string> {
  const agentSlug = agentId.replace(/[^a-zA-Z0-9_-]/g, '-');
  const worktreePath = path.join(repoRoot, '.claude-whip', `${agentSlug}-${nanoid(4)}`);
  await execa('git', ['worktree', 'add', worktreePath, 'HEAD', '--detach'], { cwd: repoRoot });
  return worktreePath;
}

export async function removeWorktree(worktreePath: string): Promise<void> {
  try {
    await execa('git', ['worktree', 'remove', worktreePath, '--force']);
  } catch {
    // best effort cleanup
  }
}

export async function getChangedFiles(worktreePath: string): Promise<string[]> {
  try {
    const { stdout } = await execa('git', ['status', '--porcelain'], { cwd: worktreePath });
    return stdout.trim().split('\n').filter(Boolean).map(line => line.substring(3).trim());
  } catch {
    return [];
  }
}

export async function commitWorktree(worktreePath: string, message: string): Promise<string | null> {
  try {
    await execa('git', ['add', '-A'], { cwd: worktreePath });
    await execa('git', ['commit', '-m', message], { cwd: worktreePath });
    const { stdout } = await execa('git', ['rev-parse', 'HEAD'], { cwd: worktreePath });
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function cherryPick(repoRoot: string, sha: string): Promise<boolean> {
  try {
    await execa('git', ['cherry-pick', sha], { cwd: repoRoot });
    return true;
  } catch {
    return false;
  }
}
