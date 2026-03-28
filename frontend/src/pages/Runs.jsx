import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileSpreadsheet, Filter, Loader2, ArrowRight } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { formatINR } from '../lib/utils'

export default function Runs() {
  const [runs, setRuns] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [clientFilter, setClientFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [periodFilter, setPeriodFilter] = useState('ALL') // format: MM-YYYY

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      if (!isSupabaseConfigured()) {
        // Mock data
        setRuns([
          {
            id: 'mock-1', client_id: 'c1', client_name: 'Mehta Industries Pvt. Ltd.', gstin: '27AABCM1234A1Z5',
            period_month: 3, period_year: 2026, status: 'completed',
            mismatch_count: 14, total_itc_at_risk: 287450, run_date: new Date().toISOString()
          },
          {
            id: 'mock-2', client_id: 'c2', client_name: 'Patel Textiles LLC', gstin: '24AABCP5678B1Z3',
            period_month: 2, period_year: 2026, status: 'completed',
            mismatch_count: 8, total_itc_at_risk: 156200, run_date: new Date(Date.now() - 86400000).toISOString()
          }
        ])
        setClients([
          { id: 'c1', name: 'Mehta Industries' },
          { id: 'c2', name: 'Patel Textiles LLC' }
        ])
        setLoading(false)
        return
      }

      // Fetch runs & clients mapping
      const [runsResp, clientsResp] = await Promise.all([
        supabase.from('reconciliation_runs').select('*, clients(client_name, gstin)').order('run_date', { ascending: false }),
        supabase.from('clients').select('id, client_name').order('client_name')
      ])

      if (runsResp.error) throw runsResp.error
      if (clientsResp.error) throw clientsResp.error

      setRuns(runsResp.data.map(r => ({
        ...r,
        client_name: r.clients?.client_name,
        gstin: r.clients?.gstin
      })))
      setClients(clientsResp.data.map(c => ({ id: c.id, name: c.client_name })))
    } catch (err) {
      console.error('Failed to fetch runs:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter computation
  const filteredRuns = runs.filter(run => {
    if (clientFilter !== 'ALL' && run.client_id !== clientFilter) return false
    if (statusFilter !== 'ALL' && run.status !== statusFilter) return false
    if (periodFilter !== 'ALL' && `${run.period_month}-${run.period_year}` !== periodFilter) return false
    return true
  })

  // Get unique periods for the filter dropdown
  const uniquePeriods = [...new Set(runs.map(r => `${r.period_month}-${r.period_year}`))].sort((a,b) => {
    const [ma, ya] = a.split('-').map(Number)
    const [mb, yb] = b.split('-').map(Number)
    return (yb - ya) || (mb - ma)
  })

  // Format month names
  const getMonthName = (m) => new Date(2000, m - 1).toLocaleString('default', { month: 'long' })

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-electric-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-navy-900 border border-navy-800 p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-electric-blue" />
            Global Reconciliation Runs
          </h1>
          <p className="text-sm text-navy-400 mt-1">Review all completed and processing ITC reports.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-navy-400 hidden sm:block" />
          
          <select 
            value={clientFilter} 
            onChange={e => setClientFilter(e.target.value)}
            className="input-field text-sm"
          >
            <option value="ALL">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          
          <select 
            value={periodFilter} 
            onChange={e => setPeriodFilter(e.target.value)}
            className="input-field text-sm"
          >
            <option value="ALL">All Periods</option>
            {uniquePeriods.map(p => {
              const [m, y] = p.split('-')
              return <option key={p} value={p}>{getMonthName(m)} {y}</option>
            })}
          </select>

          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="input-field text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-navy-800 bg-navy-900/50 text-xs font-semibold text-navy-400 tracking-wider">
                <th className="p-4 uppercase">Client</th>
                <th className="p-4 uppercase">Period</th>
                <th className="p-4 uppercase">Mismatches</th>
                <th className="p-4 uppercase">ITC AT RISK</th>
                <th className="p-4 uppercase">Status</th>
                <th className="p-4 uppercase">Date</th>
                <th className="p-4 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-navy-400">
                    No runs matched the applied filters.
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-navy-800/30 transition-colors group">
                    <td className="p-4">
                      <div className="text-sm font-medium text-white">{run.client_name}</div>
                      <div className="text-xs font-mono text-navy-400 mt-1">{run.gstin}</div>
                    </td>
                    <td className="p-4 text-sm text-navy-300">
                      {getMonthName(run.period_month)} {run.period_year}
                    </td>
                    <td className="p-4 font-mono">
                      <span className={run.mismatch_count > 0 ? "text-amber-400" : "text-emerald-400"}>
                        {run.mismatch_count}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-medium tracking-tight">
                      <span className={run.total_itc_at_risk > 0 ? "text-danger-red" : "text-emerald-400"}>
                        {formatINR(run.total_itc_at_risk)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        run.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' :
                        run.status === 'failed' ? 'bg-red-900/30 text-red-400 border-red-900/50' :
                        'bg-blue-900/30 text-blue-400 border-blue-900/50'
                      }`}>
                        {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-navy-400">
                      {new Date(run.run_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {run.status === 'completed' && (
                        <Link 
                          to={`/runs/${run.id}`}
                          className="text-electric-blue flex items-center gap-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          View <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
