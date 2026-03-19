import { createBrowserRouter, Navigate } from 'react-router';
import React from 'react';
const Dashboard = React.lazy(() => import('@/components/Dashboard'));
const App = React.lazy(() => import('@/components/App'));
const Images = React.lazy(() => import('@/components/Images'));

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
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);
