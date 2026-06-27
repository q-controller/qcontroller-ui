import { useCallback, useRef } from 'react';
import { LogsResponse } from '@/generated/proto/services/process/v1/messages';
import { LogsContext, type LogHandlers } from '@/common/logs-context';

// connection is one shared /ws/logs socket for a single instance.
interface connection {
  node: string;
  name: string;
  ws: WebSocket | null;
  subscribers: Set<LogHandlers>;
  retry: ReturnType<typeof setTimeout> | null;
}

// LogsProvider opens a socket on the first subscriber for an instance,
// fans decoded chunks out to every subscriber, reconnects on drop,
// and closes when the last subscriber leaves.
export function LogsProvider({
  children,
  wsUrl,
}: {
  children: React.ReactNode;
  wsUrl: string;
}) {
  const connectionsRef = useRef<connection[]>([]);

  const subscribeLogs = useCallback(
    (node: string, name: string, handlers: LogHandlers) => {
      let conn = connectionsRef.current.find(
        (c) => c.node === node && c.name === name
      );

      if (!conn) {
        const created: connection = {
          node,
          name,
          ws: null,
          subscribers: new Set(),
          retry: null,
        };
        connectionsRef.current.push(created);
        conn = created;

        const connect = () => {
          const url = `${wsUrl}?node=${encodeURIComponent(node)}&name=${encodeURIComponent(name)}`;
          const ws = new WebSocket(url);
          ws.binaryType = 'arraybuffer';
          created.ws = ws;

          // The server replays the full backlog on every (re)connect.
          ws.onopen = () => {
            for (const sub of created.subscribers) sub.onReset();
          };

          ws.onmessage = (event) => {
            let msg: LogsResponse;
            try {
              msg = LogsResponse.decode(new Uint8Array(event.data));
            } catch (err) {
              console.error('[logs] decode error', err);
              return;
            }
            for (const sub of created.subscribers) {
              try {
                sub.onData(msg.kind, msg.data, msg.rotated);
              } catch (err) {
                console.error('[logs] subscriber threw', err);
              }
            }
          };

          ws.onclose = () => {
            if (created.subscribers.size > 0)
              created.retry = setTimeout(connect, 2000);
          };
          ws.onerror = () => ws.close();
        };

        connect();
      }

      const active = conn;
      active.subscribers.add(handlers);

      return () => {
        active.subscribers.delete(handlers);
        if (active.subscribers.size === 0) {
          if (active.retry) clearTimeout(active.retry);
          active.ws?.close();
          connectionsRef.current = connectionsRef.current.filter(
            (c) => c !== active
          );
        }
      };
    },
    [wsUrl]
  );

  return <LogsContext value={{ subscribeLogs }}>{children}</LogsContext>;
}
