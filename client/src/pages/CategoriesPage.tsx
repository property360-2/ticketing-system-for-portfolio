import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '../api/categories.api'
import { getApiErrorMessage } from '../api/errors'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Textarea } from '../components/ui/Textarea'
import { PageError, PageLoading } from '../components/ui/PageState'
import { formatDate } from '../lib/format'

interface CategoryForm {
  id: number | null
  name: string
  description: string
}

const emptyForm: CategoryForm = { id: null, name: '', description: '' }

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<{ id: number; name: string } | null>(null)

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] })

  const saveMutation = useMutation({
    mutationFn: () =>
      form.id === null
        ? categoriesApi.create({ name: form.name, description: form.description || null })
        : categoriesApi.update(form.id, { name: form.name, description: form.description || null }),
    onSuccess: () => {
      setModalOpen(false)
      setForm(emptyForm)
      setFormError(null)
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.remove(id),
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
          <h1 className="text-2xl font-semibold text-gray-800">Categories</h1>
          <p className="text-sm text-gray-500">Ticket categories for classification.</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setModalOpen(true) }}>New Category</Button>
      </div>

      {categoriesQuery.isLoading ? (
        <PageLoading label="Loading categories..." />
      ) : categoriesQuery.isError ? (
        <PageError message="Failed to load categories." onRetry={() => categoriesQuery.refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(categoriesQuery.data ?? []).map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800">{c.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">{c.description || 'No description'}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setForm({ id: c.id, name: c.name, description: c.description ?? '' }); setModalOpen(true) }}
                  >
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting({ id: c.id, name: c.name })}>
                    Delete
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span>Used by tickets</span>
                <span>{formatDate(c.updatedAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id === null ? 'New Category' : 'Edit Category'}>
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
            id="cat-name"
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Textarea
            id="cat-desc"
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
        title="Delete category"
        message={`Delete "${deleting?.name}"? Tickets using this category will be affected.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}