import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@/index.css';
import { MantineProvider } from '@mantine/core';
import { theme } from '@/theme';
import { Notifications } from '@mantine/notifications';
import { RouterProvider } from 'react-router';
import { router } from '@/router';
import { UpdatesProvider } from '@/common/updates-provider';
import { LogsProvider } from '@/common/logs-provider';
import { AuthProvider } from '@/common/auth-provider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider
      theme={theme}
      defaultColorScheme="light"
      // No forceColorScheme – let it auto-detect
      // Globals are now via the CSS import above
    >
      <Notifications position="bottom-right" />
      <AuthProvider>
        <UpdatesProvider wsUrl="/ws">
          <LogsProvider wsUrl="/ws/logs">
            <RouterProvider router={router} />
          </LogsProvider>
        </UpdatesProvider>
      </AuthProvider>
    </MantineProvider>
  </React.StrictMode>
);
