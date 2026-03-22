import { createContext } from 'react';
import { Event } from '@/common/updates';

export const UpdatesContext = createContext<Event | null>(null);
