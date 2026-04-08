import { nanoid } from 'nanoid';

export function agentId(): string {
  return nanoid(6);
}
