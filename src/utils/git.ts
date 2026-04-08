import { execaCommand } from 'execa';
import path from 'path';

export async function isGitRepo(dir: string): Promise<boolean> {
  try {
    await execaCommand('git rev-parse --git-dir', { cwd: dir, shell: true });
    return true;
  } catch {
    return false;
  }
}

export async function getRepoRoot(dir: string): Promise<string> {
  const { stdout } = await execaCommand('git rev-parse --show-toplevel', {
    cwd: dir,
    shell: true,
  });
  return stdout.trim();
}

export async function createWorktree(repoRoot: string, agentId: string): Promise<string> {
  const worktreePath = path.join(repoRoot, '.claude-whip', agentId);
  await execaCommand(`git worktree add "${worktreePath}" HEAD --detach`, {
    cwd: repoRoot,
    shell: true,
  });
  return worktreePath;
}

export async function removeWorktree(worktreePath: string): Promise<void> {
  try {
    await execaCommand(`git worktree remove "${worktreePath}" --force`, { shell: true });
  } catch {
    // best effort cleanup
  }
}

export async function getChangedFiles(worktreePath: string): Promise<string[]> {
  try {
    const { stdout } = await execaCommand('git diff --name-only HEAD', {
      cwd: worktreePath,
      shell: true,
    });
    return stdout.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

export async function commitWorktree(worktreePath: string, message: string): Promise<string | null> {
  try {
    await execaCommand('git add -A', { cwd: worktreePath, shell: true });
    await execaCommand(`git commit -m "${message}"`, { cwd: worktreePath, shell: true });
    const { stdout } = await execaCommand('git rev-parse HEAD', { cwd: worktreePath, shell: true });
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function cherryPick(repoRoot: string, sha: string): Promise<boolean> {
  try {
    await execaCommand(`git cherry-pick ${sha}`, { cwd: repoRoot, shell: true });
    return true;
  } catch {
    return false;
  }
}
