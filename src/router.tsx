import { createBrowserRouter, Navigate } from 'react-router';
import ErrorBoundary from '@/components/ErrorBoundary';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      lazy: async () => ({
        Component: (await import('@/components/App')).default,
      }),
      errorElement: <ErrorBoundary />,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: 'dashboard',
          lazy: async () => ({
            Component: (await import('@/components/Dashboard')).default,
          }),
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
          lazy: async () => ({
            Component: (await import('@/components/NotFound')).default,
          }),
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);
