import { useState } from 'react'
import { ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react'
import { formatINR, formatGSTIN } from '../lib/utils'
import MismatchBadge from './MismatchBadge'

export default function MismatchTable({ mismatches = [] }) {
  const [sortField, setSortField] = useState('itc_at_risk')
  const [sortDir, setSortDir] = useState('desc')

  function handleSort(field) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sorted = [...mismatches].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]
    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-navy-500" />
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-electric" />
      : <ArrowDown size={12} className="text-electric" />
  }

  const columns = [
    { key: 'supplier_name', label: 'Supplier', sortable: true },
    { key: 'supplier_gstin', label: 'GSTIN', sortable: true },
    { key: 'invoice_number', label: 'Invoice No.', sortable: true },
    { key: 'mismatch_type', label: 'Type', sortable: true },
    { key: 'difference', label: 'Amount Diff', sortable: true },
    { key: 'itc_at_risk', label: 'ITC at Risk', sortable: true },
  ]

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-navy-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="table-header cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && <SortIcon field={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, idx) => (
              <tr
                key={m.id || idx}
                className="hover:bg-navy-800/30 transition-colors"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <td className="table-cell text-white font-medium">
                  {m.supplier_name || '—'}
                </td>
                <td className="table-cell font-mono text-xs text-navy-200 tracking-wider">
                  {formatGSTIN(m.supplier_gstin)}
                </td>
                <td className="table-cell font-mono text-xs text-navy-200">
                  {m.invoice_number || '—'}
                </td>
                <td className="table-cell">
                  <MismatchBadge type={m.mismatch_type} />
                </td>
                <td className="table-cell font-mono text-sm text-amber-300">
                  {formatINR(m.difference)}
                </td>
                <td className="table-cell font-mono text-sm font-semibold text-danger">
                  {formatINR(m.itc_at_risk)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="py-12 text-center text-navy-400 text-sm">
          No mismatches found.
        </div>
      )}
    </div>
  )
}
