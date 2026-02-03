import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { FaPlus, FaTrash, FaSave, FaArrowLeft } from 'react-icons/fa'

export default function BulkContributions() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [entries, setEntries] = useState([createEmptyEntry()])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
  const [systemDefaultSplit, setSystemDefaultSplit] = useState(50)

  function createEmptyEntry() {
    return {
      id: Date.now() + Math.random(),
      userId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      type: 'BASIC',
      liftPercentage: 50,
      aaPercentage: 50
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchSplitSetting()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data.filter(u => u.role === 'ALUMNI' && u.active))
    } catch (err) {
      showToast('Failed to fetch users', 'error')
    }
  }

  const fetchSplitSetting = async () => {
    try {
      const res = await api.get('/admin/settings/basic_contribution_split_lift')
      const split = parseFloat(res.data.value)
      setSystemDefaultSplit(split)
      // Update existing entries with system default
      setEntries(prev => prev.map(e => ({
        ...e,
        liftPercentage: e.type === 'BASIC' ? split : e.liftPercentage,
        aaPercentage: e.type === 'BASIC' ? 100 - split : e.aaPercentage
      })))
    } catch (err) {
      console.error('Failed to fetch split setting')
    }
  }

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000)
  }

  const addEntry = () => {
    const newEntry = createEmptyEntry()
    newEntry.liftPercentage = systemDefaultSplit
    newEntry.aaPercentage = 100 - systemDefaultSplit
    setEntries([...entries, newEntry])
  }

  const removeEntry = (id) => {
    if (entries.length === 1) {
      showToast('At least one entry is required', 'error')
      return
    }
    setEntries(entries.filter(e => e.id !== id))
  }

  const updateEntry = (id, field, value) => {
    setEntries(entries.map(e => {
      if (e.id !== id) return e

      const updated = { ...e, [field]: value }

      // Handle type change
      if (field === 'type') {
        if (value === 'BASIC') {
          updated.liftPercentage = systemDefaultSplit
          updated.aaPercentage = 100 - systemDefaultSplit
        } else {
          updated.liftPercentage = 50
          updated.aaPercentage = 50
        }
      }

      // Handle percentage changes
      if (field === 'liftPercentage') {
        const lift = Math.min(100, Math.max(0, Number(value) || 0))
        updated.liftPercentage = lift
        updated.aaPercentage = 100 - lift
      }
      if (field === 'aaPercentage') {
        const aa = Math.min(100, Math.max(0, Number(value) || 0))
        updated.aaPercentage = aa
        updated.liftPercentage = 100 - aa
      }

      return updated
    }))
  }

  const calculateStats = () => {
    const validEntries = entries.filter(e => e.userId && e.amount && Number(e.amount) > 0)
    const totalAmount = validEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const totalLift = validEntries.reduce((sum, e) => {
      const amount = Number(e.amount || 0)
      return sum + (amount * (e.liftPercentage || 0) / 100)
    }, 0)
    const totalAA = validEntries.reduce((sum, e) => {
      const amount = Number(e.amount || 0)
      return sum + (amount * (e.aaPercentage || 0) / 100)
    }, 0)

    return {
      totalEntries: entries.length,
      validEntries: validEntries.length,
      totalAmount,
      totalLift,
      totalAA
    }
  }

  const validateEntries = () => {
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]
      if (!e.userId) {
        showToast(`Entry ${i + 1}: Please select a user`, 'error')
        return false
      }
      if (!e.amount || isNaN(e.amount) || Number(e.amount) <= 0) {
        showToast(`Entry ${i + 1}: Please enter a valid amount`, 'error')
        return false
      }
      if (!e.date) {
        showToast(`Entry ${i + 1}: Please select a date`, 'error')
        return false
      }
      if (!e.type) {
        showToast(`Entry ${i + 1}: Please select a type`, 'error')
        return false
      }
      if (e.type === 'ADDITIONAL') {
        if (Math.abs((e.liftPercentage || 0) + (e.aaPercentage || 0) - 100) > 0.01) {
          showToast(`Entry ${i + 1}: LIFT and AA percentages must sum to 100%`, 'error')
          return false
        }
      }
    }
    return true
  }

  const handleSave = async () => {
    if (!validateEntries()) return

    setLoading(true)
    try {
      const contributions = entries.map(e => ({
        userId: e.userId,
        amount: Number(e.amount),
        date: e.date,
        notes: e.notes || null,
        type: e.type,
        liftPercentage: e.liftPercentage,
        aaPercentage: e.aaPercentage
      }))

      const res = await api.post('/admin/contributions/bulk', { contributions })
      showToast(`Successfully created ${res.data.created} contributions`, 'success')

      // Navigate back to contributions page after short delay
      setTimeout(() => navigate('/admin/contributions'), 1500)
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save contributions', 'error')
    } finally {
      setLoading(false)
    }
  }

  const stats = calculateStats()

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/contributions')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            <FaArrowLeft />
          </button>
          <h2 className="text-2xl font-bold">Bulk Add Contributions</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={loading || stats.validEntries === 0}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="animate-spin mr-2">...</span>
          ) : (
            <FaSave className="mr-2" />
          )}
          Save All ({stats.validEntries})
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Entries</div>
          <div className="text-2xl font-bold">{stats.totalEntries}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Valid Entries</div>
          <div className="text-2xl font-bold text-green-600">{stats.validEntries}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Amount</div>
          <div className="text-2xl font-bold text-blue-600">₹{stats.totalAmount.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">LIFT Total</div>
          <div className="text-2xl font-bold text-indigo-600">₹{stats.totalLift.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">AA Total</div>
          <div className="text-2xl font-bold text-purple-600">₹{stats.totalAA.toLocaleString()}</div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User *</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type *</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount (₹) *</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">LIFT %</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">AA %</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date *</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Notes</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-3 py-2">
                    <select
                      value={entry.userId}
                      onChange={(e) => updateEntry(entry.id, 'userId', e.target.value)}
                      className="w-full p-2 border rounded text-sm min-w-[200px]"
                    >
                      <option value="">Select user</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={entry.type}
                      onChange={(e) => updateEntry(entry.id, 'type', e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value="BASIC">Basic</option>
                      <option value="ADDITIONAL">Additional</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={entry.amount}
                      onChange={(e) => updateEntry(entry.id, 'amount', e.target.value)}
                      className="w-full p-2 border rounded text-sm min-w-[100px]"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={entry.liftPercentage}
                      onChange={(e) => updateEntry(entry.id, 'liftPercentage', e.target.value)}
                      className="w-full p-2 border rounded text-sm w-20"
                      disabled={entry.type === 'BASIC'}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={entry.aaPercentage}
                      onChange={(e) => updateEntry(entry.id, 'aaPercentage', e.target.value)}
                      className="w-full p-2 border rounded text-sm w-20"
                      disabled={entry.type === 'BASIC'}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={entry.date}
                      onChange={(e) => updateEntry(entry.id, 'date', e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={entry.notes}
                      onChange={(e) => updateEntry(entry.id, 'notes', e.target.value)}
                      className="w-full p-2 border rounded text-sm min-w-[150px]"
                      placeholder="Optional notes"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded"
                      title="Remove entry"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Row Button */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={addEntry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
          >
            <FaPlus className="mr-2" /> Add Row
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-4 text-sm text-gray-500">
        <p>* Required fields. BASIC contributions use the system default split ({systemDefaultSplit}% LIFT / {100 - systemDefaultSplit}% AA).</p>
        <p>All contributions will be automatically approved upon save.</p>
      </div>
    </div>
  )
}
