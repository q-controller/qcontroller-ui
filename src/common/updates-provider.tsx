import { useEffect, useState } from 'react';
import { SubscribeRequest, SubscribeResponse, Update } from '@/common/updates';
import { UpdatesContext } from '@/common/updates-context';

export function UpdatesProvider({
  children,
  wsUrl,
}: {
  children: React.ReactNode;
  wsUrl: string;
}) {
  const [data, setData] = useState<Update | null>(null);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      const req: SubscribeRequest = {};
      const encoded = SubscribeRequest.encode(req).finish();
      ws.send(encoded);
    };

    ws.onmessage = (event) => {
      const message = SubscribeResponse.decode(new Uint8Array(event.data));
      setData(message.update || null);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = (event) => {
      console.info('WebSocket closed:', event.code, event.reason);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [wsUrl]);

  return (
    <UpdatesContext.Provider value={data}>{children}</UpdatesContext.Provider>
  );
}
