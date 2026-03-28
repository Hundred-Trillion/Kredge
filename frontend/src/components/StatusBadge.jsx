import { getStatusConfig } from '../lib/utils'

export default function StatusBadge({ status }) {
  const config = getStatusConfig(status)
  return (
    <span className={config.className}>
      {status === 'processing' && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1.5" />
      )}
      {config.label}
    </span>
  )
}
