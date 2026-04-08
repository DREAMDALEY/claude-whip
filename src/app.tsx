import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { Header } from './ui/Header.js';
import { AgentCard } from './ui/AgentCard.js';
import { StatusBar } from './ui/StatusBar.js';
import { Orchestrator, type WhipState } from './core/orchestrator.js';

interface AppProps {
  task: string;
  whipLevel: number;
  model: string;
  agentBudget: number;
  totalBudget: number;
  dryRun: boolean;
  interactive: boolean;
}

function KeyboardHandler({ orchestrator, state }: { orchestrator: Orchestrator; state: WhipState | null }) {
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
      process.exit(0);
    }
    if (input === 'w' && state?.status === 'done') {
      orchestrator.whip().catch(console.error);
    }
  });

  return null;
}

export function App({ task, whipLevel, model, agentBudget, totalBudget, dryRun, interactive }: AppProps) {
  const { exit } = useApp();
  const [state, setState] = useState<WhipState | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [orchestrator] = useState(() => new Orchestrator({
    task,
    whipLevel,
    model,
    agentBudget,
  }));

  useEffect(() => {
    orchestrator.onStateChange((s) => {
      setState(s);
      if (s.status === 'done' && !interactive) {
        setTimeout(() => { exit(); }, 100);
      }
    });
    orchestrator.run().catch(err => { console.error('Error:', err.message); exit(); });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const s = orchestrator.getState();
      setElapsed(Date.now() - s.startedAt);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  if (!state) {
    return <Text color="yellow">Initializing...</Text>;
  }

  const canWhip = state.status === 'done' && interactive;
  const doneCount = state.agents.filter(a => a.status === 'done').length;
  const totalCount = state.agents.length;

  return (
    <Box flexDirection="column">
      {interactive && <KeyboardHandler orchestrator={orchestrator} state={state} />}

      <Header
        whipLevel={state.whipLevel}
        totalCost={state.totalCost}
        elapsed={elapsed}
        status={state.status}
        agentCount={totalCount}
      />

      <Box paddingX={1} marginY={1}>
        <Text color="white" bold>Task: </Text>
        <Text color="gray">{task}</Text>
      </Box>

      {state.status === 'decomposing' && (
        <Box paddingX={1}>
          <Text color="yellow">Decomposing task into {state.whipLevel + 1} agents...</Text>
        </Box>
      )}

      {state.agents.length > 0 && (
        <Box flexDirection="row" flexWrap="wrap" paddingX={1} gap={1}>
          {state.agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </Box>
      )}

      {state.status === 'merging' && (
        <Box paddingX={1}>
          <Text color="cyan">Merging agent results...</Text>
        </Box>
      )}

      {state.mergeResult && (
        <Box flexDirection="column" paddingX={1} marginY={1}>
          <Text bold color={state.mergeResult.success ? 'green' : 'red'}>
            {state.mergeResult.success ? 'All agents merged' : 'Merge conflicts'}
          </Text>
          <Text color="gray">
            {state.mergeResult.merged.length} merged | {state.mergeResult.conflicts.length} conflicts | {state.mergeResult.totalFiles} files
          </Text>
        </Box>
      )}

      {state.status === 'done' && (
        <Box paddingX={1} marginY={1}>
          <Text color="green" bold>
            Done! {doneCount}/{totalCount} agents completed. Total: ${state.totalCost.toFixed(3)}
          </Text>
        </Box>
      )}

      {interactive && <StatusBar canWhip={canWhip} canMerge={false} />}
    </Box>
  );
}
