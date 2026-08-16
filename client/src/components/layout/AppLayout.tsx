import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../features/auth/AuthContext'
import type { Role } from '../../types'
import { roleLabels } from '../../lib/constants'
import { Button } from '../ui/Button'

interface NavItem {
  to: string
  label: string
  roles: Role[]
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', roles: ['EMPLOYEE', 'TECHNICIAN', 'ADMIN'] },
  { to: '/tickets', label: 'Tickets', roles: ['EMPLOYEE', 'TECHNICIAN', 'ADMIN'] },
  { to: '/tickets/create', label: 'Create Ticket', roles: ['EMPLOYEE', 'TECHNICIAN'] },
  { to: '/users', label: 'Users', roles: ['ADMIN'] },
  { to: '/departments', label: 'Departments', roles: ['ADMIN'] },
  { to: '/categories', label: 'Categories', roles: ['ADMIN'] },
  { to: '/activity', label: 'Activity Logs', roles: ['ADMIN'] },
  { to: '/profile', label: 'Profile', roles: ['EMPLOYEE', 'TECHNICIAN', 'ADMIN'] },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const visibleItems = user ? navItems.filter((item) => item.roles.includes(user.role)) : []
  const closeSidebar = () => setSidebarOpen(false)

  const handleLogout = async () => {
    setLogoutLoading(true)
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:w-60 lg:translate-x-0 lg:shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
          <span className="text-lg font-semibold text-gray-800">HelpDesk</span>
          <button
            onClick={closeSidebar}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <p className="truncate text-sm font-medium text-gray-800">{user?.name}</p>
          <p className="text-xs text-gray-500">
            {user?.role ? roleLabels[user.role] : ''}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 w-full"
            onClick={handleLogout}
            loading={logoutLoading}
          >
            Logout
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <span className="text-lg font-semibold text-gray-800">HelpDesk</span>
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded p-1 text-gray-600 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}