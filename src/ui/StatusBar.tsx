import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  canWhip: boolean;
  canMerge: boolean;
}

export function StatusBar({ canWhip, canMerge }: StatusBarProps) {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} justifyContent="center" gap={2}>
      {canWhip && <Text color="yellow">[w] Whip harder</Text>}
      {canMerge && <Text color="green">[m] Merge now</Text>}
      <Text color="red">[q] Quit</Text>
    </Box>
  );
}
