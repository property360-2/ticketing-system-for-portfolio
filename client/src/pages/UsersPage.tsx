import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../api/users.api'
import { departmentsApi } from '../api/departments.api'
import { getApiErrorMessage } from '../api/errors'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Pagination } from '../components/ui/Pagination'
import { Select } from '../components/ui/Select'
import { EmptyState } from '../components/ui/EmptyState'
import { PageError, PageLoading } from '../components/ui/PageState'
import { roleLabels, roles } from '../lib/constants'
import { formatDate } from '../lib/format'
import type { Role } from '../types'

const PAGE_SIZE = 10

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE' as Role,
    departmentId: '',
  })

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  })

  const usersQuery = useQuery({
    queryKey: ['users', page, search, roleFilter],
    queryFn: () =>
      usersApi.getAll({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        role: roleFilter ? (roleFilter as Role) : undefined,
      }),
    placeholderData: (previousData) => previousData,
  })

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const createUserMutation = useMutation({
    mutationFn: () =>
      usersApi.create({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
      }),
    onSuccess: () => {
      setCreateOpen(false)
      setForm({ name: '', email: '', password: '', role: 'EMPLOYEE', departmentId: '' })
      setCreateError(null)
      invalidateUsers()
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => usersApi.updateRole(id, role),
    onSuccess: invalidateUsers,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.updateStatus(id, isActive),
    onSuccess: invalidateUsers,
  })

  const departments = departmentsQuery.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Users</h1>
          <p className="text-sm text-gray-500">Manage user accounts and roles.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>New User</Button>
      </div>

      <Card className="p-4">
        <form
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            setSearch(searchInput.trim())
          }}
        >
          <Input
            id="user-search"
            placeholder="Search name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Select id="role-filter" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}>
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {roleLabels[r]}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {usersQuery.isError ? (
          <div className="p-4">
            <PageError message="Failed to load users." onRetry={() => usersQuery.refetch()} />
          </div>
        ) : usersQuery.isLoading ? (
          <PageLoading label="Loading users..." />
        ) : (usersQuery.data?.items.length ?? 0) === 0 ? (
          <EmptyState title="No users found" description="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 md:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersQuery.data?.items.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">{user.email}</td>
                    <td className="px-4 py-3">
                      <Select
                        id={`role-${user.id}`}
                        className="w-36"
                        value={user.role}
                        onChange={(e) =>
                          updateRoleMutation.mutate({ id: user.id, role: e.target.value as Role })
                        }
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {roleLabels[r]}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">{user.departmentName ?? '\u2014'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({ id: user.id, isActive: !user.isActive })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <Badge tone={user.isActive ? 'green' : 'gray'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usersQuery.data && (
              <div className="px-4">
                <Pagination
                  page={usersQuery.data.page}
                  total={usersQuery.data.total}
                  pageSize={usersQuery.data.pageSize}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New User">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            setCreateError(null)
            createUserMutation.mutate(undefined, {
              onError: (err) => setCreateError(getApiErrorMessage(err)),
            })
          }}
        >
          <Input
            id="new-name"
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            id="new-email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            id="new-password"
            label="Temporary password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              id="new-role"
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </Select>
            <Select
              id="new-department"
              label="Department"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              <option value="">None</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
          {createError && <p className="text-xs text-red-600">{createError}</p>}
          <p className="text-xs text-gray-400">
            Note: this sample does not include a password reset flow.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createUserMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}