import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import MetricCard from '../components/MetricCard'
import MismatchTable from '../components/MismatchTable'
import { formatINR, formatPeriod, formatDate, apiUrl } from '../lib/utils'
import axios from 'axios'
import {
  ArrowLeft,
  Download,
  MessageCircle,
  AlertTriangle,
  FileWarning,
  ShieldAlert,
  Percent,
  FileText,
  CheckCircle,
} from 'lucide-react'

// Demo data — the hero screen experience
const DEMO_RUN = {
  id: 'demo-result',
  client_name: 'Mehta Industries Pvt. Ltd.',
  gstin: '27AABCM1234A1Z5',
  period_month: 3,
  period_year: 2026,
  run_date: '2026-03-25T14:30:00',
  status: 'completed',
  total_purchases: 3450000,
  total_matched: 2850000,
  total_itc_at_risk: 287450,
  mismatch_count: 14,
  invoice_count: 156,
}

const DEMO_MISMATCHES = [
  { id: '1', supplier_name: 'Reliance Steel Ltd.', supplier_gstin: '27AAACR5678B1Z3', invoice_number: 'INV-2026-0834', invoice_date: '2026-03-05', purchase_register_amount: 450000, gstr2b_amount: 0, difference: 450000, mismatch_type: 'MISSING_IN_2B', itc_at_risk: 81000 },
  { id: '2', supplier_name: 'Tata Chemicals Pvt Ltd', supplier_gstin: '24AAACT1234C1Z1', invoice_number: 'TC/23-24/1567', invoice_date: '2026-03-12', purchase_register_amount: 280000, gstr2b_amount: 250000, difference: 30000, mismatch_type: 'VALUE_MISMATCH', itc_at_risk: 54000 },
  { id: '3', supplier_name: 'JSW Paints Dealers', supplier_gstin: '29AABCJ9012D1Z7', invoice_number: 'JSW-029384', invoice_date: '2026-03-08', purchase_register_amount: 195000, gstr2b_amount: 0, difference: 195000, mismatch_type: 'MISSING_IN_2B', itc_at_risk: 35100 },
  { id: '4', supplier_name: 'Bharat Electricals Corp', supplier_gstin: '27AABCB3456E1Z9', invoice_number: 'BEC-2026-445', invoice_date: '2026-03-15', purchase_register_amount: 167000, gstr2b_amount: 0, difference: 167000, mismatch_type: 'MISSING_IN_2B', itc_at_risk: 30060 },
  { id: '5', supplier_name: 'Ambuja Cements Ltd', supplier_gstin: '24AAACA7890F1Z2', invoice_number: 'AMB/24/09823', invoice_date: '2026-03-03', purchase_register_amount: 134000, gstr2b_amount: 120000, difference: 14000, mismatch_type: 'VALUE_MISMATCH', itc_at_risk: 25200 },
  { id: '6', supplier_name: 'Supreme Industries', supplier_gstin: '27AABCS4567G1Z4', invoice_number: 'SI-MAR-2026-112', invoice_date: '2026-03-18', purchase_register_amount: 112000, gstr2b_amount: 0, difference: 112000, mismatch_type: 'MISSING_IN_2B', itc_at_risk: 20160 },
  { id: '7', supplier_name: 'Larsen & Toubro', supplier_gstin: '27AAACL8901H1Z6', invoice_number: 'LT-WO-56789', invoice_date: '2026-03-10', purchase_register_amount: 98000, gstr2b_amount: 88000, difference: 10000, mismatch_type: 'VALUE_MISMATCH', itc_at_risk: 17640 },
  { id: '8', supplier_name: 'Asian Paints Ltd', supplier_gstin: '27AAACA2345I1Z8', invoice_number: 'AP/26/MH/4421', invoice_date: '2026-03-20', purchase_register_amount: 76000, gstr2b_amount: 0, difference: 76000, mismatch_type: 'MISSING_IN_2B', itc_at_risk: 13680 },
  { id: '9', supplier_name: 'Polycab India Ltd', supplier_gstin: '24AABCP6789J1Z0', invoice_number: 'PCB-56723', invoice_date: '2026-03-14', purchase_register_amount: 54000, gstr2b_amount: 54000, difference: 0, mismatch_type: 'GSTIN_MISMATCH', itc_at_risk: 4860 },
  { id: '10', supplier_name: 'Havells India Ltd', supplier_gstin: '07AABCH1234K1Z3', invoice_number: 'HAV/MAR/8821', invoice_date: '2026-03-22', purchase_register_amount: 45000, gstr2b_amount: 40000, difference: 5000, mismatch_type: 'VALUE_MISMATCH', itc_at_risk: 5750 },
]

export default function ReconciliationResults() {
  const { runId } = useParams()
  const { isDemoMode } = useAuth()
  const [run, setRun] = useState(null)
  const [mismatches, setMismatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)

  useEffect(() => {
    if (isDemoMode || runId === 'demo-result') {
      setRun(DEMO_RUN)
      setMismatches(DEMO_MISMATCHES)
      setLoading(false)
      return
    }

    // TODO: Fetch from API
    async function fetchResults() {
      try {
        const [runRes, mismatchRes] = await Promise.all([
          axios.get(apiUrl(`/api/v1/reconciliation/runs/${runId}`)),
          axios.get(apiUrl(`/api/v1/reconciliation/runs/${runId}/mismatches`)),
        ])
        setRun(runRes.data)
        setMismatches(mismatchRes.data)
      } catch (err) {
        console.error('Failed to load results:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [runId, isDemoMode])

  async function handleDownloadPDF() {
    setDownloading(true)
    try {
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 1500))
        alert('PDF download is available when the backend is connected.')
        return
      }
      const res = await axios.get(apiUrl(`/api/v1/reports/${runId}/pdf`), {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `Kredge_ITC_Report_${run.client_name?.replace(/\s+/g, '_')}_${run.period_month}_${run.period_year}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  async function handleWhatsApp() {
    setSendingWhatsApp(true)
    try {
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 1000))
        alert('WhatsApp alerts require API configuration.')
        return
      }
      await axios.post(apiUrl(`/api/v1/whatsapp/send`), { run_id: runId })
      alert('WhatsApp summary sent successfully!')
    } catch (err) {
      alert('Failed to send WhatsApp alert.')
    } finally {
      setSendingWhatsApp(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-electric border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!run) {
    return (
      <div className="text-center py-12">
        <p className="text-navy-400">Run not found.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  const missingIn2B = mismatches.filter((m) => m.mismatch_type === 'MISSING_IN_2B').length
  const valueMismatches = mismatches.filter((m) => m.mismatch_type === 'VALUE_MISMATCH').length
  const gstinMismatches = mismatches.filter((m) => m.mismatch_type === 'GSTIN_MISMATCH').length

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back nav */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-navy-300 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Dashboard
      </Link>

      {/* THE VERDICT — ITC at Risk Banner */}
      <div className="card p-8 border-danger/30 glow-danger text-center relative overflow-hidden">
        {/* Subtle danger pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-4">
            <ShieldAlert size={120} className="text-danger" />
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-danger" />
            <span className="text-xs font-medium text-danger uppercase tracking-widest">
              Total ITC at Risk
            </span>
          </div>
          <div className="font-mono text-metric-lg text-danger tracking-tight">
            {formatINR(run.total_itc_at_risk)}
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-navy-300">
            <span>{run.client_name}</span>
            <span className="font-mono text-xs text-navy-400">{run.gstin}</span>
            <span>{formatPeriod(run.period_month, run.period_year)}</span>
          </div>
        </div>
      </div>

      {/* Mismatch Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          label="Missing in GSTR-2B"
          value={missingIn2B}
          variant="danger"
          icon={FileWarning}
          subtitle="Invoices in PR but not in 2B"
        />
        <MetricCard
          label="Value Mismatches"
          value={valueMismatches}
          variant="danger"
          icon={Percent}
          subtitle="Amount differences found"
        />
        <MetricCard
          label="GSTIN Mismatches"
          value={gstinMismatches}
          variant="info"
          icon={ShieldAlert}
          subtitle="Supplier GSTIN discrepancies"
        />
      </div>

      {/* Summary stats row */}
      <div className="flex items-center gap-6 px-1">
        <div className="flex items-center gap-2 text-sm">
          <FileText size={14} className="text-navy-400" />
          <span className="text-navy-300">{run.invoice_count} invoices analyzed</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle size={14} className="text-emerald" />
          <span className="text-navy-300">
            <span className="font-mono text-emerald">{formatINR(run.total_matched)}</span> matched
          </span>
        </div>
        <div className="text-xs text-navy-500">
          Run on {formatDate(run.run_date)}
        </div>
      </div>

      {/* Mismatch Table — the core data */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Mismatches ({mismatches.length})
        </h2>
        <MismatchTable mismatches={mismatches} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-surface-border">
        <button onClick={handleDownloadPDF} disabled={downloading} className="btn-primary">
          {downloading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {downloading ? 'Generating...' : 'Download PDF Report'}
        </button>
        <button onClick={handleWhatsApp} disabled={sendingWhatsApp} className="btn-ghost">
          {sendingWhatsApp ? (
            <span className="w-4 h-4 border-2 border-navy-300/30 border-t-navy-300 rounded-full animate-spin" />
          ) : (
            <MessageCircle size={16} />
          )}
          {sendingWhatsApp ? 'Sending...' : 'Send WhatsApp Summary'}
        </button>
      </div>
    </div>
  )
}
