import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import MetricCard from '../components/MetricCard'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { getGreeting, formatINR, formatPeriod, formatDate } from '../lib/utils'
import {
  TrendingUp,
  Users,
  Clock,
  ChevronRight,
  FileSearch,
  Plus,
} from 'lucide-react'

// Demo data for when Supabase isn't configured
const DEMO_RUNS = [
  {
    id: '1',
    client_name: 'Mehta Industries Pvt. Ltd.',
    gstin: '27AABCM1234A1Z5',
    period_month: 3,
    period_year: 2026,
    mismatch_count: 14,
    total_itc_at_risk: 287450,
    status: 'completed',
    run_date: '2026-03-25',
  },
  {
    id: '2',
    client_name: 'Patel Textiles LLC',
    gstin: '24AABCP5678B1Z3',
    period_month: 2,
    period_year: 2026,
    mismatch_count: 8,
    total_itc_at_risk: 156200,
    status: 'completed',
    run_date: '2026-03-20',
  },
  {
    id: '3',
    client_name: 'Sunrise Electronics',
    gstin: '29AABCS9012C1Z1',
    period_month: 3,
    period_year: 2026,
    mismatch_count: 0,
    total_itc_at_risk: 0,
    status: 'processing',
    run_date: '2026-03-28',
  },
  {
    id: '4',
    client_name: 'Gujarat Polymers Ltd.',
    gstin: '24AABCG3456D1Z7',
    period_month: 1,
    period_year: 2026,
    mismatch_count: 23,
    total_itc_at_risk: 412890,
    status: 'completed',
    run_date: '2026-03-15',
  },
  {
    id: '5',
    client_name: 'Bharat Auto Parts',
    gstin: '27AABCB7890E1Z9',
    period_month: 3,
    period_year: 2026,
    mismatch_count: 0,
    total_itc_at_risk: 0,
    status: 'pending',
    run_date: '2026-03-28',
  },
]

export default function Dashboard() {
  const { profile, isDemoMode } = useAuth()
  const [metrics, setMetrics] = useState({
    total_itc_recovered: 0,
    active_clients: 0,
    pending_reconciliations: 0,
  })
  const [recentRuns, setRecentRuns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In demo mode, use mock data
    if (isDemoMode) {
      setMetrics({
        total_itc_recovered: 856540,
        active_clients: 12,
        pending_reconciliations: 3,
      })
      setRecentRuns(DEMO_RUNS)
      setLoading(false)
      return
    }

    // TODO: Fetch real data from Supabase
    setLoading(false)
  }, [isDemoMode])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {getGreeting()}, {profile?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-sm text-navy-300 mt-1">
          Here's your ITC reconciliation overview.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          label="ITC Recovered This Month"
          value={metrics.total_itc_recovered}
          isCurrency
          variant="success"
          icon={TrendingUp}
          subtitle="From completed reconciliations"
        />
        <MetricCard
          label="Active Clients"
          value={metrics.active_clients}
          variant="info"
          icon={Users}
          subtitle="Clients under management"
        />
        <MetricCard
          label="Pending Reconciliations"
          value={metrics.pending_reconciliations}
          variant={metrics.pending_reconciliations > 0 ? 'danger' : 'default'}
          icon={Clock}
          subtitle={metrics.pending_reconciliations > 0 ? 'Requires attention' : 'All caught up'}
        />
      </div>

      {/* Recent Reconciliation Runs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Reconciliation Runs</h2>
          <Link to="/clients" className="btn-ghost text-sm py-1.5 px-3">
            <Plus size={14} />
            New Run
          </Link>
        </div>

        {recentRuns.length === 0 ? (
          <EmptyState
            type="runs"
            title="No reconciliation runs yet"
            description="Start by adding a client and running your first ITC reconciliation."
            action={
              <Link to="/clients" className="btn-primary">
                <Users size={16} />
                Add Your First Client
              </Link>
            }
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-navy-800/50">
                    <th className="table-header">Client</th>
                    <th className="table-header">Period</th>
                    <th className="table-header">Mismatches</th>
                    <th className="table-header">ITC at Risk</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Date</th>
                    <th className="table-header"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-navy-800/30 transition-colors group">
                      <td className="table-cell">
                        <div>
                          <p className="text-white font-medium text-sm">{run.client_name}</p>
                          <p className="text-navy-400 font-mono text-xs mt-0.5">{run.gstin}</p>
                        </div>
                      </td>
                      <td className="table-cell text-sm text-navy-200">
                        {formatPeriod(run.period_month, run.period_year)}
                      </td>
                      <td className="table-cell font-mono text-sm">
                        <span className={run.mismatch_count > 0 ? 'text-amber-300' : 'text-emerald'}>
                          {run.mismatch_count}
                        </span>
                      </td>
                      <td className="table-cell font-mono text-sm font-semibold">
                        <span className={run.total_itc_at_risk > 0 ? 'text-danger' : 'text-emerald'}>
                          {formatINR(run.total_itc_at_risk)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="table-cell text-sm text-navy-300">
                        {formatDate(run.run_date)}
                      </td>
                      <td className="table-cell">
                        <Link
                          to={`/runs/${run.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity
                                     text-electric hover:text-electric-300 text-sm flex items-center gap-1"
                        >
                          View <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
