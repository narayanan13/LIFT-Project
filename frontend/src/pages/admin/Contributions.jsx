import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { FaPlus, FaEdit, FaCheck, FaTimes, FaList } from 'react-icons/fa'
import AuditLogTable from '../../components/AuditLogTable'
import AlumniContributions from '../alumni/AlumniContributions'

function StatusBadge({ status }) {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800'
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  )
}

function TypeBadge({ type }) {
  const styles = {
    BASIC: 'bg-indigo-100 text-indigo-800',
    ADDITIONAL: 'bg-teal-100 text-teal-800'
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100'}`}>
      {type}
    </span>
  )
}

export default function AdminContributions() {
  const user = JSON.parse(localStorage.getItem('user'))
  const isTreasurer = user?.officePosition === 'TREASURER'

  // If not treasurer, show Alumni-like view
  if (!isTreasurer) {
    return <AlumniContributions />
  }

  // Treasurer view - full admin access
  return <TreasurerContributionsView />
}

function TreasurerContributionsView() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editContribution, setEditContribution] = useState(null)
  const [formData, setFormData] = useState({
    userId: '',
    amount: '',
    date: '',
    notes: '',
    type: '',
    liftPercentage: 50,
    aaPercentage: 50
  })
  const [editForm, setEditForm] = useState({
    amount: '',
    date: '',
    notes: '',
    status: '',
    liftPercentage: 50,
    aaPercentage: 50
  })
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
  const [auditLogs, setAuditLogs] = useState({})
  const [expandedAudit, setExpandedAudit] = useState(null)
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [systemDefaultSplit, setSystemDefaultSplit] = useState(50)

  useEffect(() => {
    fetchContributions()
    fetchUsers()
    fetchSplitSetting()
  }, [])

  useEffect(() => {
    fetchContributions()
  }, [startDate, endDate])

  const fetchContributions = async () => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      const res = await api.get(`/admin/contributions?${params.toString()}`)
      setList(res.data)
    } catch (err) {
      showToast('Failed to fetch contributions', 'error')
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data.filter(u => u.role === 'ALUMNI'))
    } catch (err) {
      console.error('Failed to fetch users')
    }
  }

  const fetchSplitSetting = async () => {
    try {
      const res = await api.get('/admin/settings/basic_contribution_split_lift')
      setSystemDefaultSplit(parseFloat(res.data.value))
    } catch (err) {
      console.error('Failed to fetch split setting')
    }
  }

  const fetchAuditLogs = async (contributionId) => {
    setLoadingAudit(true)
    try {
      const response = await api.get(`/admin/contributions/${contributionId}/audit-logs`)
      setAuditLogs(prev => ({ ...prev, [contributionId]: response.data }))
    } catch (error) {
      console.error('Failed to fetch audit logs', error)
      showToast('Failed to load audit history', 'error')
    } finally {
      setLoadingAudit(false)
    }
  }

  const toggleAuditHistory = async (contributionId) => {
    if (expandedAudit === contributionId) {
      setExpandedAudit(null)
    } else {
      setExpandedAudit(contributionId)
      if (!auditLogs[contributionId]) {
        await fetchAuditLogs(contributionId)
      }
    }
  }

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.userId || !formData.amount || !formData.date || !formData.type) {
      showToast('Please fill in all required fields', 'error')
      return
    }
    if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
      showToast('Please enter a valid positive amount', 'error')
      return
    }
    // Validate percentages
    if (Math.abs((formData.liftPercentage || 0) + (formData.aaPercentage || 0) - 100) > 0.01) {
      showToast('LIFT and AA percentages must sum to 100%', 'error')
      return
    }
    try {
      await api.post('/admin/contributions', {
        userId: formData.userId,
        amount: Number(formData.amount),
        date: formData.date,
        notes: formData.notes,
        type: formData.type,
        liftPercentage: formData.liftPercentage,
        aaPercentage: formData.aaPercentage
      })
      setShowModal(false)
      setFormData({
        userId: '',
        amount: '',
        date: '',
        notes: '',
        type: '',
        liftPercentage: 50,
        aaPercentage: 50
      })
      fetchContributions()
      showToast('Contribution added successfully', 'success')
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to add contribution', 'error')
    }
  }

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/contributions/${id}/approve`)
      fetchContributions()
      showToast('Contribution approved', 'success')
    } catch (error) {
      showToast('Failed to approve contribution', 'error')
    }
  }

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/contributions/${id}/reject`)
      fetchContributions()
      showToast('Contribution rejected', 'success')
    } catch (error) {
      showToast('Failed to reject contribution', 'error')
    }
  }

  const openEditModal = (contribution) => {
    setEditContribution(contribution)
    setEditForm({
      amount: contribution.amount,
      date: new Date(contribution.date).toISOString().split('T')[0],
      notes: contribution.notes || '',
      status: contribution.status,
      liftPercentage: contribution.liftPercentage || 50,
      aaPercentage: contribution.aaPercentage || 50
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editForm.amount || isNaN(editForm.amount) || Number(editForm.amount) <= 0) {
      showToast('Please enter a valid positive amount', 'error')
      return
    }
    // Only validate percentages for ADDITIONAL (BASIC uses system default)
    if (editContribution.type === 'ADDITIONAL') {
      if (Math.abs((editForm.liftPercentage || 0) + (editForm.aaPercentage || 0) - 100) > 0.01) {
        showToast('LIFT and AA percentages must sum to 100%', 'error')
        return
      }
    }
    try {
      const dataToSend = {
        amount: Number(editForm.amount),
        date: editForm.date,
        notes: editForm.notes,
        status: editForm.status
      }
      // Only include split percentages for ADDITIONAL contributions
      if (editContribution.type === 'ADDITIONAL') {
        dataToSend.liftPercentage = editForm.liftPercentage
        dataToSend.aaPercentage = editForm.aaPercentage
      }
      await api.put(`/admin/contributions/${editContribution.id}`, dataToSend)
      setEditContribution(null)
      fetchContributions()
      showToast('Contribution updated', 'success')
    } catch (error) {
      showToast('Failed to update contribution', 'error')
    }
  }

  let filteredList = list
  if (filter !== 'all') filteredList = filteredList.filter(c => c.status === filter)
  if (typeFilter !== 'all') filteredList = filteredList.filter(c => c.type === typeFilter)

  const pendingCount = list.filter(c => c.status === 'PENDING').length

  return (
    <div>
      {/* Toast Notification */}
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Contributions</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/contributions/bulk')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
          >
            <FaList className="mr-2" /> Bulk Add
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
          >
            <FaPlus className="mr-2" /> Add Contribution
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              All ({list.length})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1 rounded text-sm ${filter === 'PENDING' ? 'bg-yellow-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-3 py-1 rounded text-sm ${filter === 'APPROVED' ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('REJECTED')}
              className={`px-3 py-1 rounded text-sm ${filter === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Rejected
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">All Types</option>
            <option value="BASIC">Basic</option>
            <option value="ADDITIONAL">Additional</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 border rounded"
          />
        </div>

        {(startDate || endDate) && (
          <div className="flex items-end">
            <button
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              Clear Dates
            </button>
          </div>
        )}
      </div>

      {/* Contributions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-sm rounded">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">User</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Split</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Notes</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  No contributions found
                </td>
              </tr>
            ) : (
              filteredList.map(c => {
                return (
                  <React.Fragment key={c.id}>
                    <tr className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">{c.user?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 font-semibold text-green-600">₹{c.amount.toLocaleString()}</td>
                      <td className="px-4 py-3"><TypeBadge type={c.type} /></td>
                      <td className="px-4 py-3">
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>LIFT: ₹{(c.liftAmount || 0).toLocaleString()} ({c.liftPercentage || 0}%)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            <span>AA: ₹{(c.aaAmount || 0).toLocaleString()} ({c.aaPercentage || 0}%)</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{new Date(c.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-gray-600">{c.notes || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          {c.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(c.id)}
                                className="p-2 text-green-600 hover:bg-green-100 rounded"
                                title="Approve"
                              >
                                <FaCheck />
                              </button>
                              <button
                                onClick={() => handleReject(c.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded"
                                title="Reject"
                              >
                                <FaTimes />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => toggleAuditHistory(c.id)}
                            className="px-3 py-1 bg-purple-100 text-purple-600 rounded text-sm hover:bg-purple-200"
                            title="View History"
                          >
                            {expandedAudit === c.id ? 'Hide History' : 'View History'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedAudit === c.id && (
                      <tr className="border-t border-gray-200">
                        <td colSpan="8" className="px-4 py-4 bg-gray-50">
                          {loadingAudit && expandedAudit === c.id ? (
                            <div className="text-center py-4">
                              <span className="text-gray-500">Loading audit history...</span>
                            </div>
                          ) : (
                            <AuditLogTable auditLogs={auditLogs[c.id] || []} />
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
              )}
           </tbody>
         </table>
       </div>

      {/* Add Contribution Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Add New Contribution</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">User *</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value
                    // For BASIC: pre-fill with system default split
                    // For ADDITIONAL: use 50-50 as starting point
                    const defaultSplit = newType === 'BASIC' ? systemDefaultSplit : 50
                    setFormData({
                      ...formData,
                      type: newType,
                      liftPercentage: defaultSplit,
                      aaPercentage: 100 - defaultSplit
                    })
                  }}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select type</option>
                  <option value="BASIC">Basic (uses default split)</option>
                  <option value="ADDITIONAL">Additional (custom split)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter amount"
                  required
                />
              </div>

              {formData.type && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Split Percentage *
                    {formData.type === 'BASIC' && <span className="text-xs text-gray-500 ml-2">(using system default {systemDefaultSplit}% LIFT / {100 - systemDefaultSplit}% AA)</span>}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">LIFT %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.liftPercentage || 50}
                        onChange={(e) => {
                          const lift = Math.min(100, Math.max(0, Number(e.target.value) || 0))
                          setFormData({
                            ...formData,
                            liftPercentage: lift,
                            aaPercentage: 100 - lift
                          })
                        }}
                        className="w-full p-2 border rounded"
                        disabled={formData.type === 'BASIC'}
                        required
                      />
                      {formData.type === 'BASIC' && <p className="text-xs text-gray-500 mt-1">Set by system default</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Alumni Association %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.aaPercentage || 50}
                        onChange={(e) => {
                          const aa = Math.min(100, Math.max(0, Number(e.target.value) || 0))
                          setFormData({
                            ...formData,
                            aaPercentage: aa,
                            liftPercentage: 100 - aa
                          })
                        }}
                        className="w-full p-2 border rounded"
                        disabled={formData.type === 'BASIC'}
                        required
                      />
                      {formData.type === 'BASIC' && <p className="text-xs text-gray-500 mt-1">Set by system default</p>}
                    </div>
                  </div>
                  {formData.amount && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <div className="text-xs text-gray-600 mb-1">Preview:</div>
                      <div className="flex justify-between">
                        <span>LIFT: ₹{(Number(formData.amount) * (formData.liftPercentage || 0) / 100).toFixed(2)}</span>
                        <span>AA: ₹{(Number(formData.amount) * (formData.aaPercentage || 0) / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows="2"
                  placeholder="Add any notes..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setFormData({
                      userId: '',
                      amount: '',
                      date: '',
                      notes: '',
                      type: '',
                      liftPercentage: 50,
                      aaPercentage: 50
                    })
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contribution Modal */}
      {editContribution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit Contribution</h3>
            <p className="text-sm text-gray-600 mb-4">
              User: <strong>{editContribution.user?.name}</strong>
            </p>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Split Percentage *
                  {editContribution?.type === 'BASIC' && <span className="text-xs text-gray-500 ml-2">(using system default {systemDefaultSplit}% LIFT / {100 - systemDefaultSplit}% AA)</span>}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">LIFT %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editForm.liftPercentage || 50}
                      onChange={(e) => {
                        const lift = Math.min(100, Math.max(0, Number(e.target.value) || 0))
                        setEditForm({
                          ...editForm,
                          liftPercentage: lift,
                          aaPercentage: 100 - lift
                        })
                      }}
                      className="w-full p-2 border rounded"
                      disabled={editContribution?.type === 'BASIC'}
                      required
                    />
                    {editContribution?.type === 'BASIC' && <p className="text-xs text-gray-500 mt-1">Set by system default</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Alumni Association %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editForm.aaPercentage || 50}
                      onChange={(e) => {
                        const aa = Math.min(100, Math.max(0, Number(e.target.value) || 0))
                        setEditForm({
                          ...editForm,
                          aaPercentage: aa,
                          liftPercentage: 100 - aa
                        })
                      }}
                      className="w-full p-2 border rounded"
                      disabled={editContribution?.type === 'BASIC'}
                      required
                    />
                    {editContribution?.type === 'BASIC' && <p className="text-xs text-gray-500 mt-1">Set by system default</p>}
                  </div>
                </div>
                {editForm.amount && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <div className="text-xs text-gray-600 mb-1">Preview:</div>
                    <div className="flex justify-between">
                      <span>LIFT: ₹{(Number(editForm.amount) * (editForm.liftPercentage || 0) / 100).toFixed(2)}</span>
                      <span>AA: ₹{(Number(editForm.amount) * (editForm.aaPercentage || 0) / 100).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows="2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditContribution(null)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
