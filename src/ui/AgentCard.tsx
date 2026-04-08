import React from 'react';
import { Box, Text } from 'ink';
import type { Agent } from '../core/agent.js';

interface AgentCardProps {
  agent: Agent;
}

const STATUS_ICONS: Record<string, string> = {
  pending: '○',
  running: '●',
  done: '✓',
  error: '✗',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'gray',
  running: 'yellow',
  done: 'green',
  error: 'red',
};

export function AgentCard({ agent }: AgentCardProps) {
  const icon = STATUS_ICONS[agent.status] || '?';
  const color = STATUS_COLORS[agent.status] || 'white';
  const secs = (agent.duration / 1000).toFixed(1);
  const elapsed = agent.startedAt
    ? ((Date.now() - agent.startedAt) / 1000).toFixed(1)
    : '0.0';

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={color}
      paddingX={1}
      width="50%"
      minWidth={30}
    >
      <Box>
        <Text color={color}>{icon} </Text>
        <Text bold>{agent.slug}</Text>
        <Text color="gray"> [{agent.id}]</Text>
      </Box>

      <Text color="gray" wrap="truncate-end">
        {agent.task.substring(0, 60)}{agent.task.length > 60 ? '...' : ''}
      </Text>

      <Box marginTop={1}>
        <Text color="green">${agent.cost.toFixed(3)}</Text>
        <Text color="gray"> | </Text>
        <Text color="cyan">
          {agent.status === 'running' ? `${elapsed}s` : `${secs}s`}
        </Text>
        {agent.filesChanged.length > 0 && (
          <>
            <Text color="gray"> | </Text>
            <Text color="magenta">{agent.filesChanged.length} files</Text>
          </>
        )}
      </Box>

      {agent.error && (
        <Text color="red" wrap="truncate-end">{agent.error.substring(0, 80)}</Text>
      )}
    </Box>
  );
}
