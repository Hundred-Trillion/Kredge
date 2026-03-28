import { getMismatchConfig } from '../lib/utils'

export default function MismatchBadge({ type }) {
  const config = getMismatchConfig(type)
  return (
    <span className={config.className} title={config.description}>
      {config.label}
    </span>
  )
}
