import { createBrowserRouter, Navigate } from 'react-router';
import React from 'react';
const Dashboard = React.lazy(() => import('@/components/Dashboard'));
const App = React.lazy(() => import('@/components/App'));
const Instance = React.lazy(() => import('@/components/Instance'));
const Images = React.lazy(() => import('@/components/Images'));

/**
 * Defines the routing structure for the QController UI application with the following routes:
 * - `/` - Root route that renders the main App component
 *   - Index route redirects to `/dashboard`
 *   - `/dashboard` - Main dashboard view
 *   - `/images` - Images management view
 *   - `/instances/:instanceName` - Dynamic route for individual instance details
 *
 * The router is configured with a basename from the environment variable BASE_URL
 * to support deployment in subdirectories.
 */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: 'dashboard',
          element: <Dashboard />,
        },
        {
          path: 'images',
          element: <Images></Images>,
        },
        {
          path: 'instances/:instanceName',
          element: <Instance />,
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);
