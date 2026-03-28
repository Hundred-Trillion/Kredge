import { formatINR } from '../lib/utils'

export default function MetricCard({
  label,
  value,
  isCurrency = false,
  variant = 'default', // 'default' | 'success' | 'danger' | 'info'
  icon: Icon,
  subtitle,
  animate = true,
}) {
  const variants = {
    default: {
      bg: 'bg-surface',
      border: 'border-surface-border',
      iconBg: 'bg-navy-700',
      iconColor: 'text-navy-200',
      valueColor: 'text-white',
      glow: '',
    },
    success: {
      bg: 'bg-surface',
      border: 'border-emerald/20',
      iconBg: 'bg-emerald/10',
      iconColor: 'text-emerald',
      valueColor: 'text-emerald',
      glow: 'glow-emerald',
    },
    danger: {
      bg: 'bg-surface',
      border: 'border-danger/20',
      iconBg: 'bg-danger/10',
      iconColor: 'text-danger',
      valueColor: 'text-danger',
      glow: 'glow-danger',
    },
    info: {
      bg: 'bg-surface',
      border: 'border-electric/20',
      iconBg: 'bg-electric/10',
      iconColor: 'text-electric',
      valueColor: 'text-white',
      glow: 'glow-electric',
    },
  }

  const v = variants[variant] || variants.default

  const displayValue = isCurrency ? formatINR(value) : (value ?? 0).toLocaleString('en-IN')

  return (
    <div className={`${v.bg} rounded-xl border ${v.border} ${v.glow} p-5 ${animate ? 'animate-slide-up' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-medium text-navy-200 uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg ${v.iconBg} flex items-center justify-center`}>
            <Icon size={18} className={v.iconColor} />
          </div>
        )}
      </div>
      <div className={`font-mono text-metric ${v.valueColor} tracking-tight leading-none`}>
        {displayValue}
      </div>
      {subtitle && (
        <p className="text-xs text-navy-300 mt-2">{subtitle}</p>
      )}
    </div>
  )
}
