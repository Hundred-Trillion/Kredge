import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import StepIndicator from '../components/StepIndicator'
import FileDropZone from '../components/FileDropZone'
import { getMonthName, apiUrl } from '../lib/utils'
import axios from 'axios'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  FileSpreadsheet,
  FileJson,
  Play,
  Loader2,
} from 'lucide-react'

const STEPS = ['Select Period', 'Purchase Register', 'GSTR-2B', 'Run Kredge']

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: getMonthName(i + 1),
}))

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i)

const PR_COLUMNS = [
  'Invoice No', 'Supplier GSTIN', 'Supplier Name',
  'Invoice Date', 'Taxable Value',
]

export default function NewReconciliation() {
  const { id: clientId } = useParams()
  const navigate = useNavigate()
  const { isDemoMode } = useAuth()

  const [step, setStep] = useState(0)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(CURRENT_YEAR)
  const [prFile, setPrFile] = useState(null)
  const [gstr2bFile, setGstr2bFile] = useState(null)
  const [prError, setPrError] = useState('')
  const [gstr2bError, setGstr2bError] = useState('')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  function canProceed() {
    switch (step) {
      case 0: return month && year
      case 1: return !!prFile
      case 2: return !!gstr2bFile
      case 3: return true
      default: return false
    }
  }

  function handleNext() {
    if (step < 3) setStep(step + 1)
  }

  function handleBack() {
    if (step > 0) setStep(step - 1)
  }

  async function handleRun() {
    setRunning(true)
    setError('')
    setProgress('Uploading files...')

    try {
      if (isDemoMode) {
        // Simulate reconciliation in demo mode
        setProgress('Parsing purchase register...')
        await new Promise((r) => setTimeout(r, 800))
        setProgress('Parsing GSTR-2B data...')
        await new Promise((r) => setTimeout(r, 600))
        setProgress('Analyzing 156 invoices...')
        await new Promise((r) => setTimeout(r, 1200))
        setProgress('Identifying mismatches...')
        await new Promise((r) => setTimeout(r, 800))
        setProgress('Calculating ITC at risk...')
        await new Promise((r) => setTimeout(r, 500))

        // Navigate to demo results
        navigate('/runs/demo-result')
        return
      }

      const formData = new FormData()
      formData.append('purchase_register', prFile)
      formData.append('gstr2b', gstr2bFile)
      formData.append('client_id', clientId)
      formData.append('period_month', month)
      formData.append('period_year', year)

      setProgress('Analyzing invoices...')

      const response = await axios.post(
        apiUrl('/api/v1/reconciliation/run'),
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        }
      )

      if (response.data?.run_id) {
        navigate(`/runs/${response.data.run_id}`)
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Reconciliation failed'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      setRunning(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Back nav */}
      <Link
        to={`/clients/${clientId}`}
        className="inline-flex items-center gap-2 text-sm text-navy-300 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Client
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">New Reconciliation</h1>
        <p className="text-sm text-navy-300 mt-1">
          Upload your files and let Kredge find the mismatches.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex justify-center">
        <StepIndicator steps={STEPS} currentStep={step} />
      </div>

      {/* Step Content */}
      <div className="card p-6">
        {/* Step 0: Select Period */}
        {step === 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Calendar size={20} className="text-electric" />
              <h2 className="text-lg font-semibold text-white">Select Period</h2>
            </div>
            <p className="text-sm text-navy-300 mb-4">
              Choose the GST return period to reconcile.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">Month</label>
                <select
                  className="input"
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">Year</label>
                <select
                  className="input"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Upload Purchase Register */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <FileSpreadsheet size={20} className="text-emerald" />
              <h2 className="text-lg font-semibold text-white">Upload Purchase Register</h2>
            </div>
            <FileDropZone
              fileType="excel"
              label="Purchase Register (Excel)"
              description="Upload your Tally/Busy purchase register export"
              formatExamples={PR_COLUMNS}
              file={prFile}
              onFileSelect={(f) => { setPrFile(f); setPrError('') }}
              error={prError}
            />
          </div>
        )}

        {/* Step 2: Upload GSTR-2B */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <FileJson size={20} className="text-electric" />
              <h2 className="text-lg font-semibold text-white">Upload GSTR-2B</h2>
            </div>
            <FileDropZone
              fileType="json"
              label="GSTR-2B (JSON)"
              description="Download from GST portal and upload the JSON file"
              file={gstr2bFile}
              onFileSelect={(f) => { setGstr2bFile(f); setGstr2bError('') }}
              error={gstr2bError}
            />
            <div className="p-3 rounded-lg bg-navy-800 border border-surface-border">
              <p className="text-xs text-navy-300">
                <strong className="text-navy-200">How to download:</strong> Log in to{' '}
                <span className="text-electric">gst.gov.in</span> → Returns → Returns Dashboard → Select period → GSTR-2B → Download JSON
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Run */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in text-center py-4">
            {!running ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-electric/10 flex items-center justify-center mx-auto">
                  <Play size={28} className="text-electric ml-1" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">Ready to reconcile</h2>
                  <p className="text-sm text-navy-300">
                    Period: <span className="text-white font-medium">{getMonthName(month)} {year}</span>
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-3 text-xs text-navy-400">
                    {prFile && <span>📊 {prFile.name}</span>}
                    {gstr2bFile && <span>📑 {gstr2bFile.name}</span>}
                  </div>
                </div>
                <button onClick={handleRun} className="btn-primary text-base px-8 py-3">
                  <Play size={18} />
                  Run Kredge
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-electric/10 flex items-center justify-center mx-auto">
                  <Loader2 size={28} className="text-electric animate-spin" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">Reconciling...</h2>
                  <p className="text-sm text-electric animate-pulse">{progress}</p>
                </div>
              </>
            )}
            {error && (
              <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-left">
                <p className="text-sm text-danger font-medium mb-1">Reconciliation failed</p>
                <p className="text-xs text-danger/80">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      {!running && (
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="btn-ghost"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          {step < 3 && (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-primary"
            >
              Next
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
