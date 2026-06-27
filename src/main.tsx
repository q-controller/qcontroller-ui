import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/index.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { RouterProvider } from 'react-router';
import { router } from '@/router';
import { UpdatesProvider } from '@/common/updates-provider';
import { LogsProvider } from '@/common/logs-provider';
import { AuthProvider } from '@/common/auth-provider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider
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
