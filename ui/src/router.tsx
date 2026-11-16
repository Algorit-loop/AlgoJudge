import { createBrowserRouter } from 'react-router'

import { AppLayout } from './components/AppLayout'
import { RequireRole } from './components/RequireRole'
import { UsersPage } from './pages/admin/UsersPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ComingSoonPage, NotFoundPage } from './pages/MessagePage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { StatusPage } from './pages/StatusPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
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
      { path: '/status', element: <StatusPage /> },
      // Built in later milestones.
      { path: '/problems', element: <ComingSoonPage /> },
      { path: '/contests', element: <ComingSoonPage /> },
      { path: '/submissions', element: <ComingSoonPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
