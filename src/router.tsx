import { createBrowserRouter, Navigate } from 'react-router';
import React from 'react';
const Dashboard = React.lazy(() => import('@/components/Dashboard'));
const App = React.lazy(() => import('@/components/App'));
const NotFound = React.lazy(() => import('@/components/NotFound'));
import ErrorBoundary from '@/components/ErrorBoundary';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      errorElement: <ErrorBoundary />,
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
          lazy: async () => {
            const [mod, loaderMod] = await Promise.all([
              import('@/components/Images'),
              import('@/components/Images.loader'),
            ]);
            return { Component: mod.default, loader: loaderMod.loader };
          },
        },
        {
          path: '*',
          element: <NotFound />,
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);
