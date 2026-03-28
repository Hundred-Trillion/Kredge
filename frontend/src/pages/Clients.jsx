import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AddClientModal from '../components/AddClientModal'
import EmptyState from '../components/EmptyState'
import { formatGSTIN, formatDate } from '../lib/utils'
import { Plus, Search, ChevronRight, Building2 } from 'lucide-react'

// Demo clients
const DEMO_CLIENTS = [
  { id: '1', client_name: 'Mehta Industries Pvt. Ltd.', gstin: '27AABCM1234A1Z5', default_gst_rate: 18, created_at: '2026-01-10', run_count: 5, last_run: '2026-03-25' },
  { id: '2', client_name: 'Patel Textiles LLC', gstin: '24AABCP5678B1Z3', default_gst_rate: 18, created_at: '2026-01-15', run_count: 3, last_run: '2026-03-20' },
  { id: '3', client_name: 'Sunrise Electronics', gstin: '29AABCS9012C1Z1', default_gst_rate: 18, created_at: '2026-02-01', run_count: 2, last_run: '2026-03-28' },
  { id: '4', client_name: 'Gujarat Polymers Ltd.', gstin: '24AABCG3456D1Z7', default_gst_rate: 12, created_at: '2026-02-10', run_count: 4, last_run: '2026-03-15' },
  { id: '5', client_name: 'Bharat Auto Parts', gstin: '27AABCB7890E1Z9', default_gst_rate: 18, created_at: '2026-02-20', run_count: 1, last_run: '2026-03-28' },
  { id: '6', client_name: 'Deccan Pharmaceuticals', gstin: '36AADCD1234F1Z2', default_gst_rate: 12, created_at: '2026-03-01', run_count: 0, last_run: null },
]

export default function Clients() {
  const { isDemoMode } = useAuth()
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode) {
      setClients(DEMO_CLIENTS)
      setLoading(false)
      return
    }
    // TODO: Fetch from Supabase
    setLoading(false)
  }, [isDemoMode])

  const filtered = clients.filter((c) =>
    c.client_name.toLowerCase().includes(search.toLowerCase()) ||
    c.gstin.toLowerCase().includes(search.toLowerCase())
  )

  function handleAddClient(clientData) {
    // In demo mode, add to local state
    const newClient = {
      id: Date.now().toString(),
      ...clientData,
      created_at: new Date().toISOString(),
      run_count: 0,
      last_run: null,
    }
    setClients([newClient, ...clients])
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-sm text-navy-300 mt-1">
            {clients.length} client{clients.length !== 1 ? 's' : ''} under management
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={16} />
          Add Client
        </button>
      </div>

      {/* Search */}
      {clients.length > 0 && (
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search by name or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Client List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-electric border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          type="clients"
          title="No clients yet"
          description="Add your first client to start running ITC reconciliations."
          action={
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus size={16} />
              Add Your First Client
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <Link
              key={client.id}
              to={`/clients/${client.id}`}
              className="card-hover p-5 group block"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-electric/10 flex items-center justify-center">
                  <Building2 size={18} className="text-electric" />
                </div>
                <ChevronRight size={16} className="text-navy-500 group-hover:text-electric transition-colors" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-electric transition-colors">
                {client.client_name}
              </h3>
              <p className="font-mono text-xs text-navy-400 tracking-wider mb-3">
                {formatGSTIN(client.gstin)}
              </p>
              <div className="flex items-center gap-4 text-xs text-navy-400">
                <span>{client.run_count} run{client.run_count !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>GST {client.default_gst_rate}%</span>
                {client.last_run && (
                  <>
                    <span>•</span>
                    <span>Last: {formatDate(client.last_run)}</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 && clients.length > 0 && search && (
        <div className="text-center py-12">
          <p className="text-navy-400">No clients match "{search}"</p>
        </div>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddClient}
      />
    </div>
  )
}
