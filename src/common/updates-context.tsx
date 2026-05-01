import { createContext } from 'react';
import { Event } from '@/common/updates';

export type UpdatesSubscriber = (event: Event) => void;

export interface UpdatesContextValue {
  subscribe: (cb: UpdatesSubscriber) => () => void;
}

export const UpdatesContext = createContext<UpdatesContextValue>({
  subscribe: () => () => {},
});
