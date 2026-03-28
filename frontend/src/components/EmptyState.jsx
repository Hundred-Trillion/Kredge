import { FileX, Users, BarChart3, Inbox } from 'lucide-react'

const icons = {
  clients: Users,
  runs: BarChart3,
  files: FileX,
  default: Inbox,
}

export default function EmptyState({
  type = 'default',
  title,
  description,
  action,
}) {
  const Icon = icons[type] || icons.default

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-navy-800 border border-surface-border flex items-center justify-center mb-5">
        <Icon size={28} className="text-navy-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {title || 'Nothing here yet'}
      </h3>
      <p className="text-sm text-navy-300 text-center max-w-md mb-6">
        {description || 'Get started by creating your first item.'}
      </p>
      {action && action}
    </div>
  )
}
