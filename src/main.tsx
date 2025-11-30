import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/index.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { RouterProvider } from 'react-router';
import { router } from '@/router';
import { UpdatesProvider } from '@/common/updates-provider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UpdatesProvider wsUrl="/ws">
      <MantineProvider
        defaultColorScheme="light"
        // No forceColorScheme – let it auto-detect
        // Globals are now via the CSS import above
      >
        <Notifications position="bottom-right" />
        <RouterProvider router={router} />
      </MantineProvider>
    </UpdatesProvider>
  </React.StrictMode>
);
