# claude-whip

Crack the whip on Claude Code. Parallel agent orchestration from your terminal.

Give Claude a task. Whip it to break it down into specialized parallel agents. The more you whip, the more agents deploy.

## How it works

```
Whip 1:  One agent handles everything
Whip 2:  Task splits into 3 parallel agents
Whip 3:  Each agent splits again — 9+ agents running simultaneously
Whip N:  Keeps subdividing until tasks are atomic
```

Each agent runs in an isolated git worktree. Results merge back automatically.

## Install

```bash
npm install -g claude-whip
```

Requires [Claude Code CLI](https://claude.ai/claude-code) installed.

## Usage

```bash
# Single agent (whip level 1)
claude-whip "add dark mode to the settings page"

# Split into 3 parallel agents
claude-whip -w 2 "add user auth with JWT, routes, middleware, and tests"

# Go harder — 9+ agents
claude-whip -w 3 "refactor the entire API to TypeScript"

# See the plan without executing
claude-whip -w 2 --dry-run "build a REST API for blog posts"
```

## Terminal UI

```
┌──────────────────────────────────────────────────────┐
│ 🔥🔥 claude-whip   Whip 2 | $0.14 | 12.3s | 3 agents│
│ Status: running                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Task: "Add user auth with JWT"                      │
│                                                      │
│  ╭─ auth-routes [a3x9k2] ──╮ ╭─ jwt-middleware ────╮ │
│  │ ● Running...             │ │ ✓ Done              │ │
│  │ Creating auth endpoints  │ │ JWT verify + tests  │ │
│  │ $0.08 | 8.2s             │ │ $0.06 | 6.1s        │ │
│  ╰──────────────────────────╯ ╰─────────────────────╯ │
│                                                      │
│  ╭─ db-schema [b7m2p1] ────────────────────────────╮ │
│  │ ● Running... Adding users table migration        │ │
│  │ $0.04 | 4.5s                                     │ │
│  ╰──────────────────────────────────────────────────╯ │
│                                                      │
├──────────────────────────────────────────────────────┤
│     [w] Whip harder     [q] Quit                     │
└──────────────────────────────────────────────────────┘
```

Press `w` after agents complete to whip again — each task splits further.

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `-w, --whip <N>` | `1` | Initial whip level |
| `-m, --model <model>` | `sonnet` | Claude model |
| `--budget <$>` | `5.00` | Max total budget |
| `--agent-budget <$>` | `1.00` | Max per-agent budget |
| `--dry-run` | `false` | Show plan only |

## How agents work

1. **Decompose**: Claude analyzes your task and breaks it into independent subtasks
2. **Isolate**: Each agent gets its own git worktree (full repo copy)
3. **Execute**: All agents run Claude Code in parallel
4. **Merge**: Results cherry-pick back into your branch

Agents can't interfere with each other — full file isolation via git worktrees.

## License

MIT
