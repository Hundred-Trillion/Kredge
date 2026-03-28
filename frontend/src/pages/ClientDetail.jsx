import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { formatINR, formatGSTIN, formatPeriod, formatDate } from '../lib/utils'
import {
  ArrowLeft,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Building2,
} from 'lucide-react'

// Demo data
const DEMO_CLIENT = {
  id: '1',
  client_name: 'Mehta Industries Pvt. Ltd.',
  gstin: '27AABCM1234A1Z5',
  default_gst_rate: 18,
  created_at: '2026-01-10',
}

const DEMO_CLIENT_RUNS = [
  {
    id: '1', period_month: 3, period_year: 2026, mismatch_count: 14,
    total_itc_at_risk: 287450, total_purchases: 3450000, total_matched: 2850000,
    status: 'completed', run_date: '2026-03-25', invoice_count: 156,
  },
  {
    id: '2', period_month: 2, period_year: 2026, mismatch_count: 8,
    total_itc_at_risk: 156200, total_purchases: 2890000, total_matched: 2600000,
    status: 'completed', run_date: '2026-02-22', invoice_count: 134,
  },
  {
    id: '3', period_month: 1, period_year: 2026, mismatch_count: 3,
    total_itc_at_risk: 45000, total_purchases: 3100000, total_matched: 3050000,
    status: 'completed', run_date: '2026-01-20', invoice_count: 148,
  },
]

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDemoMode } = useAuth()
  const [client, setClient] = useState(null)
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode) {
      setClient(DEMO_CLIENT)
      setRuns(DEMO_CLIENT_RUNS)
      setLoading(false)
      return
    }
    // TODO: Fetch from Supabase
    setLoading(false)
  }, [id, isDemoMode])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-electric border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!client) {
    return (
      <EmptyState
        title="Client not found"
        description="This client doesn't exist or you don't have access."
        action={
          <Link to="/clients" className="btn-primary">
            <ArrowLeft size={16} /> Back to Clients
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back nav */}
      <Link
        to="/clients"
        className="inline-flex items-center gap-2 text-sm text-navy-300 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Clients
      </Link>

      {/* Client Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-electric/10 flex items-center justify-center">
            <Building2 size={22} className="text-electric" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{client.client_name}</h1>
            <p className="font-mono text-sm text-navy-300 tracking-wider mt-1">
              {formatGSTIN(client.gstin)}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-navy-400">
              <span>GST Rate: {client.default_gst_rate}%</span>
              <span>•</span>
              <span>Added: {formatDate(client.created_at)}</span>
            </div>
          </div>
        </div>
        <Link
          to={`/clients/${id}/reconcile`}
          className="btn-primary"
        >
          <Plus size={16} />
          New Reconciliation
        </Link>
      </div>

      {/* Runs Timeline */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Reconciliation History</h2>

        {runs.length === 0 ? (
          <EmptyState
            type="runs"
            title="No reconciliations yet"
            description="Run your first ITC reconciliation for this client."
            action={
              <Link to={`/clients/${id}/reconcile`} className="btn-primary">
                <Plus size={16} />
                Run First Reconciliation
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {runs.map((run, idx) => (
              <Link
                key={run.id}
                to={`/runs/${run.id}`}
                className="card-hover p-5 flex items-center gap-5 group block"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    run.status === 'completed'
                      ? run.total_itc_at_risk > 0 ? 'bg-danger' : 'bg-emerald'
                      : 'bg-navy-400'
                  }`} />
                  {idx < runs.length - 1 && (
                    <div className="w-px h-8 bg-surface-border mt-1" />
                  )}
                </div>

                {/* Run details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-white font-semibold text-sm">
                      {formatPeriod(run.period_month, run.period_year)}
                    </span>
                    <StatusBadge status={run.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-navy-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(run.run_date)}
                    </span>
                    <span>{run.invoice_count} invoices</span>
                    <span className="flex items-center gap-1">
                      {run.mismatch_count > 0 ? (
                        <AlertTriangle size={12} className="text-amber-400" />
                      ) : (
                        <CheckCircle size={12} className="text-emerald" />
                      )}
                      {run.mismatch_count} mismatch{run.mismatch_count !== 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>

                {/* ITC at Risk */}
                <div className="text-right">
                  <p className={`font-mono text-lg font-bold ${
                    run.total_itc_at_risk > 0 ? 'text-danger' : 'text-emerald'
                  }`}>
                    {formatINR(run.total_itc_at_risk)}
                  </p>
                  <p className="text-xs text-navy-400">ITC at risk</p>
                </div>

                <ChevronRight size={16} className="text-navy-500 group-hover:text-electric transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
