import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { departmentsApi } from '../api/departments.api'
import { getApiErrorMessage } from '../api/errors'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Textarea } from '../components/ui/Textarea'
import { PageError, PageLoading } from '../components/ui/PageState'
import { formatDate } from '../lib/format'

interface DepartmentForm {
  id: number | null
  name: string
  description: string
}

const emptyForm: DepartmentForm = { id: null, name: '', description: '' }

export default function DepartmentsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<DepartmentForm>(emptyForm)
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<{ id: number; name: string } | null>(null)

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['departments'] })

  const saveMutation = useMutation({
    mutationFn: () =>
      form.id === null
        ? departmentsApi.create({ name: form.name, description: form.description || null })
        : departmentsApi.update(form.id, { name: form.name, description: form.description || null }),
    onSuccess: () => {
      setModalOpen(false)
      setForm(emptyForm)
      setFormError(null)
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => departmentsApi.remove(id),
    onSuccess: () => {
      setDeleting(null)
      if (form.id !== null) setForm(emptyForm)
      invalidate()
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Departments</h1>
          <p className="text-sm text-gray-500">Organizational units tickets belong to.</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setModalOpen(true) }}>New Department</Button>
      </div>

      {departmentsQuery.isLoading ? (
        <PageLoading label="Loading departments..." />
      ) : departmentsQuery.isError ? (
        <PageError message="Failed to load departments." onRetry={() => departmentsQuery.refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(departmentsQuery.data ?? []).map((d) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800">{d.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">{d.description || 'No description'}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setForm({ id: d.id, name: d.name, description: d.description ?? '' }); setModalOpen(true) }}
                  >
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting({ id: d.id, name: d.name })}>
                    Delete
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span>{d.userCount} users</span>
                <span>{formatDate(d.updatedAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id === null ? 'New Department' : 'Edit Department'}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            setFormError(null)
            if (!form.name.trim()) {
              setFormError('Name is required.')
              return
            }
            saveMutation.mutate(undefined, { onError: (err) => setFormError(getApiErrorMessage(err)) })
          }}
        >
          <Input
            id="dept-name"
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Textarea
            id="dept-desc"
            label="Description (optional)"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete department"
        message={`Delete "${deleting?.name}"? Users in this department will be unassigned.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}