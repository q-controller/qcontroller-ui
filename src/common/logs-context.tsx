import { createContext } from 'react';
import { Kind } from '@/generated/proto/services/process/v1/messages';

export interface LogHandlers {
  // onReset is called when a (re)connection opens; the server replays the full
  // backlog, so the consumer should clear before the new stream arrives.
  onReset: () => void;
  // onData is called per chunk of raw log bytes. rotated marks the first
  // chunk after the server-side file was truncated or replaced.
  onData: (kind: Kind, data: Uint8Array, rotated: boolean) => void;
}

export interface LogsContextValue {
  subscribeLogs: (
    node: string,
    name: string,
    handlers: LogHandlers
  ) => () => void;
}

export const LogsContext = createContext<LogsContextValue>({
  subscribeLogs: () => () => {},
});
