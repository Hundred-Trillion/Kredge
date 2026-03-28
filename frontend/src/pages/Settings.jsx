import { useState } from 'react'
import { Settings, Save, Loader2, Link } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export default function SettingsPage() {
  const { profile, isDemoMode } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    firm_name: profile?.firm_name || 'Sharma & Associates',
    phone: profile?.phone || '+91 98765 43210',
    whatsapp_alerts: profile?.whatsapp_alerts ?? true,
    email_signature: profile?.email_signature || 'Best regards,\nRajesh Sharma\nSharma & Associates',
    default_gst_rate: profile?.default_gst_rate || 18.0,
    deadline_buffer_days: profile?.deadline_buffer_days || 5,
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (isDemoMode || !isSupabaseConfigured()) {
        // Mock save
        await new Promise(resolve => setTimeout(resolve, 800))
        setSuccess(true)
        return
      }

      const { data, error: err } = await supabase.auth.getSession()
      if (err) throw err
      
      const token = data.session?.access_token
      if (!token) throw new Error("No active session")

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error("Failed to save settings to API")

      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6 text-electric-blue" />
        <h1 className="text-2xl font-bold text-white">Firm Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg text-sm">
            Settings saved successfully.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Section */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-medium text-white border-b border-navy-800 pb-2">Firm Profile</h2>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-navy-300">Firm Name</label>
              <input
                type="text"
                name="firm_name"
                value={formData.firm_name}
                onChange={handleChange}
                className="input-field w-full text-white"
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-navy-300">Contact Phone (for WhatsApp)</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field w-full text-white"
                placeholder="+91..."
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-navy-300">Email Signature</label>
              <textarea
                name="email_signature"
                value={formData.email_signature}
                onChange={handleChange}
                className="input-field w-full text-white h-24 resize-none"
                placeholder="Best regards..."
              />
              <p className="text-xs text-navy-500">Appended to automated supplier follow-up emails.</p>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-medium text-white border-b border-navy-800 pb-2">Reconciliation Preferences</h2>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-navy-300">Default GST Rate (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                name="default_gst_rate"
                value={formData.default_gst_rate}
                onChange={handleChange}
                className="input-field w-full text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-navy-300">GST Deadline Buffer (Days)</label>
              <input
                type="number"
                min="0"
                max="20"
                name="deadline_buffer_days"
                value={formData.deadline_buffer_days}
                onChange={handleChange}
                className="input-field w-full text-white"
              />
              <p className="text-xs text-navy-500">Number of days before the 11th/20th to trigger strict alerts.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="relative inline-block w-12 mr-2 align-middle transition duration-200 ease-in select-none">
                <input
                  type="checkbox"
                  name="whatsapp_alerts"
                  id="whatsapp_alerts"
                  checked={formData.whatsapp_alerts}
                  onChange={handleChange}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                  style={{ transform: formData.whatsapp_alerts ? 'translateX(100%)' : 'translateX(0)', borderColor: formData.whatsapp_alerts ? '#2D6FF7' : '#1e293b' }}
                />
                <label
                  htmlFor="whatsapp_alerts"
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${
                    formData.whatsapp_alerts ? 'bg-electric-blue' : 'bg-slate-800'
                  }`}
                ></label>
              </div>
              <label htmlFor="whatsapp_alerts" className="text-sm font-medium text-white cursor-pointer select-none flex flex-col">
                <span>WhatsApp Alerts</span>
                <span className="text-xs text-navy-400 font-normal">Receive run completion & monthly summaries on WhatsApp.</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-navy-800 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </form>
      
      {/* Integrations Card */}
      <div className="card p-6 mt-6">
         <h2 className="text-lg font-medium text-white border-b border-navy-800 pb-2 mb-4">Integrations</h2>
         <div className="flex items-center justify-between p-4 border border-navy-800 rounded bg-navy-900/50">
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded bg-emerald-900/30 flex items-center justify-center text-emerald-400">
               <Link className="Vw-5 h-5" />
             </div>
             <div>
               <h3 className="font-medium text-white">Tally / Busy ERP</h3>
               <p className="text-xs text-navy-400">Column normalizer auto-configured for V1/V2 exports.</p>
             </div>
           </div>
           <span className="px-3 py-1 bg-emerald-900/50 text-emerald-400 text-xs font-medium rounded-full border border-emerald-900">Connected</span>
         </div>
      </div>
    </div>
  )
}
