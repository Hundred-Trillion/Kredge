import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, TrendingUp, Presentation, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { formatINR } from '../lib/utils'
import MetricCard from '../components/MetricCard'

export default function ClientPortal() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)
  const [runs, setRuns] = useState([])

  useEffect(() => {
    fetchPortalData()
  }, [token])

  async function fetchPortalData() {
    setLoading(true)
    setError(null)
    try {
      // Parallel fetch for summary and runs list
      const [summaryRes, runsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/portal/${token}/summary`),
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/portal/${token}/runs`)
      ])

      if (!summaryRes.ok) throw new Error("Invalid or expired portal link.")
      
      const summaryData = await summaryRes.json()
      const runsData = runsRes.ok ? await runsRes.json() : []

      setSummary(summaryData)
      setRuns(runsData)
    } catch (err) {
      console.error("Portal API Error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-electric-blue mb-4" />
        <p className="text-navy-400 font-medium">Loading Reconciliation Reports...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4">
        <div className="card max-w-md p-8 text-center border-red-900/50">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-navy-400">{error}</p>
        </div>
      </div>
    )
  }

  const getMonthName = (m) => new Date(2000, m - 1).toLocaleString('default', { month: 'long' })

  return (
    <div className="min-h-screen bg-navy-950 text-slate-300 font-sans selection:bg-electric-blue/30 relative">
      <div className="fixed inset-0 pointer-events-none grid-pattern opacity-[0.03]"></div>
      
      {/* Header */}
      <header className="border-b border-navy-800 bg-navy-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-electric-blue flex items-center justify-center text-white font-bold tracking-tighter">K</div>
            <span className="text-xl font-bold tracking-tight text-white">KREDGE <span className="text-xs font-normal text-electric-blue ml-1 uppercase tracking-widest">Portal</span></span>
          </div>
          
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{summary.client_name}</p>
            <p className="text-xs font-mono text-navy-400">{summary.gstin}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 animate-fade-in">
        
        {/* Intro Banner */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Your GST ITC Health</h1>
          <p className="text-navy-300">
            A real-time overview of your Input Tax Credit reconciliations processed by your CA. Track missing credits and supplier compliance automatically.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total ITC Recovered"
            value={formatINR(summary.total_itc_recovered)}
            icon={TrendingUp}
            trend="amount retrieved to date"
            variant="success"
          />
          <MetricCard
            title="Reconciliations Run"
            value={summary.total_runs.toString()}
            icon={FileSpreadsheet}
            trend="historical months analyzed"
          />
          <MetricCard
            title="Latest Processing"
            value={summary.latest_period}
            icon={Presentation}
            trend="most recent report"
          />
        </div>

        {/* History Table */}
        <div className="card">
          <div className="p-6 border-b border-navy-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Reconciliation Statement Ledger</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy-900/50">
                  <th className="p-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Filing Period</th>
                  <th className="p-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Matched ITC</th>
                  <th className="p-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Flagged Deficits</th>
                  <th className="p-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">ITC At Risk</th>
                  <th className="p-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {runs.length === 0 ? (
                  <tr><td colSpan="5" className="p-6 text-center text-navy-400">No data available yet.</td></tr>
                ) : (
                  runs.map(run => (
                    <tr key={run.id} className="hover:bg-navy-800/30 transition-colors">
                      <td className="p-4 font-medium text-white">{getMonthName(run.period_month)} {run.period_year}</td>
                      <td className="p-4 font-mono text-emerald-400">{formatINR(run.total_matched * 0.18)}</td>
                      <td className="p-4 font-mono text-navy-300">{run.mismatch_count} discrepancies</td>
                      <td className="p-4 font-mono font-medium">
                        <span className={run.total_itc_at_risk > 0 ? "text-danger-red" : "text-emerald-400"}>
                          {formatINR(run.total_itc_at_risk)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          run.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' :
                          'bg-blue-900/30 text-blue-400 border-blue-900/50'
                        }`}>
                          {run.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-navy-800 py-6 text-center">
         <p className="text-xs text-navy-500">Secure Report generated via <strong className="text-navy-400">Kredge Platform</strong></p>
      </footer>
    </div>
  )
}
