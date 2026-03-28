import { useState, useEffect } from 'react'
import { Building2, AlertTriangle, ShieldCheck, Mail, Loader2, Info } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { formatINR } from '../lib/utils'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  async function fetchSuppliers() {
    try {
      if (!isSupabaseConfigured()) {
        // Mock data for demo mode
        setSuppliers([
          {
            id: '1',
            supplier_gstin: '27AAACR5678B1Z3',
            supplier_name: 'Reliance Steel Ltd.',
            risk_level: 'RED',
            consecutive_defaults: 3,
            total_itc_loss: 81000.0,
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            supplier_gstin: '24AAACT1234C1Z1',
            supplier_name: 'Tata Chemicals Pvt Ltd',
            risk_level: 'YELLOW',
            consecutive_defaults: 1,
            total_itc_loss: 54000.0,
            updated_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: '3',
            supplier_gstin: '29AABCS9012C1Z1',
            supplier_name: 'Sunrise Electronics',
            risk_level: 'GREEN',
            consecutive_defaults: 0,
            total_itc_loss: 0,
            updated_at: new Date(Date.now() - 172800000).toISOString()
          }
        ])
        setLoading(false)
        return
      }

      const { data, error: err } = await supabase
        .from('supplier_profiles')
        .select('*')
        .order('consecutive_defaults', { ascending: false })

      if (err) throw err
      setSuppliers(data || [])
    } catch (err) {
      console.error('Failed to fetch suppliers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getRiskBadge = (level) => {
    switch (level) {
      case 'RED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-900/50">
            <AlertTriangle className="w-3.5 h-3.5" />
            High Risk
          </span>
        )
      case 'YELLOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-900/50">
            <Info className="w-3.5 h-3.5" />
            Watchlist
          </span>
        )
      case 'GREEN':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-900/50">
            <ShieldCheck className="w-3.5 h-3.5" />
            Reliable
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-electric-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-electric-blue" />
            Supplier Risk Matrix
          </h1>
          <p className="text-navy-300 mt-1">
            Global supplier performance rated by consecutive GSTR-2B defaults across all clients.
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          {error}
        </div>
      ) : (
        <div className="card rounded-lg overflow-hidden border border-navy-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-navy-800 bg-navy-900/50">
                  <th className="p-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="p-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="p-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">
                    Consecutive Defaults
                  </th>
                  <th className="p-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">
                    Hist. ITC Loss
                  </th>
                  <th className="p-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">
                    Last Default
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-navy-400">
                      No supplier profiles found. Process reconciliations to build profiles.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr 
                      key={supplier.id} 
                      className="hover:bg-navy-800/20 transition-colors"
                    >
                      <td className="p-4">
                        <p className="text-sm font-medium text-white">{supplier.supplier_name}</p>
                        <p className="text-xs text-navy-400 font-mono mt-1">{supplier.supplier_gstin}</p>
                      </td>
                      <td className="p-4">
                        {getRiskBadge(supplier.risk_level)}
                      </td>
                      <td className="p-4 text-sm text-navy-300">
                        {supplier.consecutive_defaults}
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm text-red-400 font-medium tracking-tight">
                          {formatINR(supplier.total_itc_loss)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-navy-300">
                        {new Date(supplier.updated_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
