export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  )
}