import { createBrowserRouter } from 'react-router'

import { lazyPage } from './lazyPage'

import { AppLayout } from './components/AppLayout'
import { RequireRole } from './components/RequireRole'
import { UsersPage } from './pages/admin/UsersPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ComingSoonPage, NotFoundPage } from './pages/MessagePage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { RouteError } from './pages/RouteError'
import { StatusPage } from './pages/StatusPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    // Never leave a blank screen: render errors (incl. a page's code failing to load) show RouteError.
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/users/:username', element: <ProfilePage /> },
      {
        path: '/admin/users',
        element: (
          <RequireRole roles={['admin']}>
            <UsersPage />
          </RequireRole>
        ),
      },
      {
        path: '/admin/catalog',
        element: (
          <RequireRole roles={['admin']}>{lazyPage(() => import('./pages/admin/CatalogPage'), 'CatalogPage')}</RequireRole>
        ),
      },
      { path: '/status', element: <StatusPage /> },
      // Built in later milestones.
      { path: '/problems', element: lazyPage(() => import('./pages/problems/ProblemListPage'), 'ProblemListPage') },
      {
        path: '/problems/new',
        element: (
          <RequireRole roles={['setter']}>
            {lazyPage(() => import('./pages/problems/ProblemCreatePage'), 'ProblemCreatePage')}
          </RequireRole>
        ),
      },
      { path: '/problems/:code', element: lazyPage(() => import('./pages/problems/ProblemPage'), 'ProblemPage') },
      {
        path: '/problems/:code/edit',
        element: (
          <RequireRole roles={['setter']}>
            {lazyPage(() => import('./pages/problems/ProblemEditPage'), 'ProblemEditPage')}
          </RequireRole>
        ),
      },
      { path: '/contests', element: <ComingSoonPage /> },
      { path: '/submissions', element: <ComingSoonPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
