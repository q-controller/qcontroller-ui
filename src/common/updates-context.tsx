import { createContext } from 'react';
import { Update } from '@/common/updates';

export const UpdatesContext = createContext<Update | null>(null);
