import { useEffect, useState, useRef } from 'react';
import { SubscribeRequest, Event } from '@/common/updates';
import { UpdatesContext } from '@/common/updates-context';

export function UpdatesProvider({
  children,
  wsUrl,
}: {
  children: React.ReactNode;
  wsUrl: string;
}) {
  const [data, setData] = useState<Event | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        const message = Event.decode(new Uint8Array(event.data));
        setData(message);
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
    <UpdatesContext.Provider value={data}>{children}</UpdatesContext.Provider>
  );
}
