import React from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  whipLevel: number;
  totalCost: number;
  elapsed: number;
  status: string;
  agentCount: number;
}

export function Header({ whipLevel, totalCost, elapsed, status, agentCount }: HeaderProps) {
  const secs = (elapsed / 1000).toFixed(1);
  const whips = '🔥'.repeat(Math.min(whipLevel, 5));

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="red" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color="red">
          {whips} claude-whip
        </Text>
        <Text>
          <Text color="yellow">Whip {whipLevel}</Text>
          <Text color="gray"> | </Text>
          <Text color="green">${totalCost.toFixed(3)}</Text>
          <Text color="gray"> | </Text>
          <Text color="cyan">{secs}s</Text>
          <Text color="gray"> | </Text>
          <Text color="magenta">{agentCount} agent{agentCount !== 1 ? 's' : ''}</Text>
        </Text>
      </Box>
      <Text color="gray" dimColor>
        Status: {status}
      </Text>
    </Box>
  );
}
