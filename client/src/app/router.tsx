import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAuth, RequireRole } from '../features/auth/RequireAuth'
import AppLayout from '../components/layout/AppLayout'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import TicketsPage from '../pages/TicketsPage'
import TicketDetailsPage from '../pages/TicketDetailsPage'
import CreateTicketPage from '../pages/CreateTicketPage'
import UsersPage from '../pages/UsersPage'
import DepartmentsPage from '../pages/DepartmentsPage'
import CategoriesPage from '../pages/CategoriesPage'
import ActivityLogsPage from '../pages/ActivityLogsPage'
import ProfilePage from '../pages/ProfilePage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'tickets', element: <TicketsPage /> },
          {
            element: <RequireRole roles={['EMPLOYEE', 'TECHNICIAN']} />,
            children: [{ path: 'tickets/create', element: <CreateTicketPage /> }],
          },
          { path: 'tickets/:ticketId', element: <TicketDetailsPage /> },
          {
            element: <RequireRole roles={['ADMIN']} />,
            children: [
              { path: 'users', element: <UsersPage /> },
              { path: 'departments', element: <DepartmentsPage /> },
              { path: 'categories', element: <CategoriesPage /> },
              { path: 'activity', element: <ActivityLogsPage /> },
            ],
          },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])