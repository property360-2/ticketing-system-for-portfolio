import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ticketsApi } from '../api/tickets.api'
import { departmentsApi } from '../api/departments.api'
import { categoriesApi } from '../api/categories.api'
import { useAuth } from '../features/auth/AuthContext'
import { getApiErrorMessage } from '../api/errors'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { PageError, PageLoading } from '../components/ui/PageState'
import { priorityLabels, ticketPriorities } from '../lib/constants'
import type { TicketPriority } from '../types'

const createSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().min(1, 'Description is required').max(4000, 'Description is too long'),
  priority: z.enum(ticketPriorities, 'Select a priority'),
  categoryId: z.string().min(1, 'Select a category'),
  departmentId: z.string().min(1, 'Select a department'),
})

type CreateForm = z.infer<typeof createSchema>

export default function CreateTicketPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  })
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      departmentId: user?.departmentId?.toString() ?? '',
      categoryId: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: CreateForm) =>
      ticketsApi.create({
        title: values.title,
        description: values.description,
        priority: values.priority,
        categoryId: Number(values.categoryId),
        departmentId: Number(values.departmentId),
      }),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      navigate(`/tickets/${ticket.id}`)
    },
  })

  if (departmentsQuery.isLoading || categoriesQuery.isLoading) {
    return <PageLoading label="Loading form..." />
  }
  if (departmentsQuery.isError || categoriesQuery.isError) {
    return <PageError message="Failed to load lookup data." />
  }

  const onSubmit = (values: CreateForm) => {
    setError(null)
    mutation.mutate(values, {
      onError: (e) => setError(getApiErrorMessage(e)),
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Create Ticket</h1>
        <p className="text-sm text-gray-500">Describe the issue you are reporting.</p>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="title"
            label="Title"
            placeholder="Brief summary of the issue"
            error={errors.title?.message}
            {...register('title')}
          />

          <Textarea
            id="description"
            label="Description"
            rows={6}
            placeholder="Detailed description of the issue..."
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              id="priority"
              label="Priority"
              error={errors.priority?.message}
              defaultValue={ticketPriorities[0]}
              {...register('priority')}
            >
              {ticketPriorities.map((p) => (
                <option key={p} value={p}>
                  {priorityLabels[p as TicketPriority]}
                </option>
              ))}
            </Select>

            <Select id="departmentId" label="Department" error={errors.departmentId?.message} {...register('departmentId')}>
              <option value="">Select department</option>
              {(departmentsQuery.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select id="categoryId" label="Category" error={errors.categoryId?.message} {...register('categoryId')}>
              <option value="">Select category</option>
              {(categoriesQuery.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Create Ticket
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}