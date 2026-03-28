import { useState } from 'react'
import { X } from 'lucide-react'

export default function AddClientModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    client_name: '',
    gstin: '',
    default_gst_rate: 18,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  function validateGSTIN(gstin) {
    // Basic GSTIN format: 2 digits state code + 10 char PAN + 1 entity code + 1 Z + 1 checksum
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return regex.test(gstin.toUpperCase())
  }

  function validate() {
    const errs = {}
    if (!formData.client_name.trim()) errs.client_name = 'Client name is required'
    if (!formData.gstin.trim()) {
      errs.gstin = 'GSTIN is required'
    } else if (formData.gstin.length !== 15) {
      errs.gstin = 'GSTIN must be exactly 15 characters'
    } else if (!validateGSTIN(formData.gstin)) {
      errs.gstin = 'Invalid GSTIN format'
    }
    if (formData.default_gst_rate < 0 || formData.default_gst_rate > 100) {
      errs.default_gst_rate = 'GST rate must be between 0 and 100'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await onAdd({
        ...formData,
        gstin: formData.gstin.toUpperCase(),
      })
      setFormData({ client_name: '', gstin: '', default_gst_rate: 18 })
      setErrors({})
      onClose()
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to add client' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative card p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Add New Client</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-300 hover:text-white hover:bg-navy-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-200 mb-1.5">
              Client Name
            </label>
            <input
              type="text"
              className={errors.client_name ? 'input-error' : 'input'}
              placeholder="e.g. ABC Enterprises Pvt. Ltd."
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            />
            {errors.client_name && (
              <p className="text-xs text-danger mt-1">{errors.client_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-200 mb-1.5">
              GSTIN
            </label>
            <input
              type="text"
              className={`${errors.gstin ? 'input-error' : 'input'} font-mono uppercase tracking-wider`}
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
            />
            {errors.gstin && (
              <p className="text-xs text-danger mt-1">{errors.gstin}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-200 mb-1.5">
              Default GST Rate (%)
            </label>
            <input
              type="number"
              className="input font-mono w-32"
              min="0"
              max="100"
              step="0.5"
              value={formData.default_gst_rate}
              onChange={(e) => setFormData({ ...formData, default_gst_rate: parseFloat(e.target.value) || 0 })}
            />
            {errors.default_gst_rate && (
              <p className="text-xs text-danger mt-1">{errors.default_gst_rate}</p>
            )}
          </div>

          {errors.submit && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
              <p className="text-sm text-danger">{errors.submit}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Client'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
