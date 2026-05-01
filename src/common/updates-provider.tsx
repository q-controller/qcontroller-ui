import { useEffect, useRef, useCallback } from 'react';
import { SubscribeRequest, Event } from '@/common/updates';
import {
  UpdatesContext,
  type UpdatesSubscriber,
} from '@/common/updates-context';

export function UpdatesProvider({
  children,
  wsUrl,
}: {
  children: React.ReactNode;
  wsUrl: string;
}) {
  const subscribersRef = useRef<Set<UpdatesSubscriber>>(new Set());
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // subscribe is referentially stable so consumers can safely include it in
  // useEffect deps without re-subscribing on every render.
  const subscribe = useCallback((cb: UpdatesSubscriber) => {
    subscribersRef.current.add(cb);
    return () => {
      subscribersRef.current.delete(cb);
    };
  }, []);

  useEffect(() => {
    let stopped = false;

    function connect() {
      if (stopped) return;

      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        const req: SubscribeRequest = {};
        const encoded = SubscribeRequest.encode(req).finish();
        ws.send(encoded);
      };

      ws.onmessage = (event) => {
        let message: Event;
        try {
          message = Event.decode(new Uint8Array(event.data));
        } catch (err) {
          console.error('[ws] decode error', err);
          return;
        }
        // Fan out synchronously to each subscriber. No React state in this
        // path so React 18 batching can't coalesce events — every WS message
        // is delivered to every consumer.
        for (const sub of subscribersRef.current) {
          try {
            sub(message);
          } catch (err) {
            console.error('[ws] subscriber threw', err);
          }
        }
      };

      ws.onclose = () => {
        if (!stopped) {
          retryRef.current = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      stopped = true;
      if (retryRef.current) {
        clearTimeout(retryRef.current);
      }
    };
  }, [wsUrl]);

  return (
    <UpdatesContext.Provider value={{ subscribe }}>
      {children}
    </UpdatesContext.Provider>
  );
}
