import { runClaude } from '../utils/claude-cli.js';
import type { SubTask } from './agent.js';

export async function decompose(
  task: string,
  targetCount: number,
  model: string
): Promise<SubTask[]> {
  const prompt = `You are a task decomposition engine for a coding assistant.

Break this task into exactly ${targetCount} independent, parallelizable subtasks.

TASK: ${task}

Rules:
- Each subtask MUST be independently executable (no ordering dependencies)
- Each subtask should modify DIFFERENT files when possible
- Be specific — each subtask should have a clear, atomic deliverable
- Use short kebab-case IDs (e.g., "auth-routes", "db-schema", "add-tests")

Respond with ONLY a JSON array, no other text:
[{"id": "short-slug", "description": "specific thing to do", "files_hint": ["file1.ts", "file2.ts"]}]`;

  const result = await runClaude(prompt, { model, budget: 0.10 });

  try {
    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = result.result;
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const subtasks: SubTask[] = JSON.parse(jsonStr);

    if (!Array.isArray(subtasks) || subtasks.length === 0) {
      throw new Error('Decomposition returned empty array');
    }

    return subtasks;
  } catch (err) {
    // Fallback: return the whole task as a single subtask
    return [{
      id: 'full-task',
      description: task,
    }];
  }
}

export function redecompose(subtask: SubTask, targetCount: number): string {
  return `Further break down this subtask into ${targetCount} smaller, atomic tasks:
"${subtask.description}"

Each sub-subtask should be a single focused change (one file, one function, one test).`;
}
