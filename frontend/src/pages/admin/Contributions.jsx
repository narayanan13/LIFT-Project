import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { FaPlus, FaEdit, FaCheck, FaTimes, FaList } from 'react-icons/fa'
import ContributionHistoryTable from '../../components/ContributionHistoryTable'
import AlumniContributions from '../alumni/AlumniContributions'

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
    liftAmount: '',
    aaAmount: '',
    date: '',
    notes: '',
    type: ''
  })
  const [editForm, setEditForm] = useState({
    liftAmount: '',
    aaAmount: '',
    date: '',
    notes: '',
    status: ''
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
      setUsers(res.data.filter(u => u.active))
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
    const liftAmt = Number(formData.liftAmount) || 0
    const aaAmt = Number(formData.aaAmount) || 0
    const totalAmount = liftAmt + aaAmt

    if (!formData.userId || !formData.date || !formData.type) {
      showToast('Please fill in all required fields', 'error')
      return
    }
    if (totalAmount <= 0) {
      showToast('Please enter valid amounts for LIFT and/or Alumni Association', 'error')
      return
    }

    // Calculate percentages from amounts
    const liftPercentage = (liftAmt / totalAmount) * 100
    const aaPercentage = (aaAmt / totalAmount) * 100

    try {
      await api.post('/admin/contributions', {
        userId: formData.userId,
        amount: totalAmount,
        date: formData.date,
        notes: formData.notes,
        type: formData.type,
        liftPercentage: liftPercentage,
        aaPercentage: aaPercentage
      })
      setShowModal(false)
      setFormData({
        userId: '',
        liftAmount: '',
        aaAmount: '',
        date: '',
        notes: '',
        type: ''
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
      liftAmount: contribution.liftAmount || 0,
      aaAmount: contribution.aaAmount || 0,
      date: new Date(contribution.date).toISOString().split('T')[0],
      notes: contribution.notes || '',
      status: contribution.status
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    const liftAmt = Number(editForm.liftAmount) || 0
    const aaAmt = Number(editForm.aaAmount) || 0
    const totalAmount = liftAmt + aaAmt

    if (totalAmount <= 0) {
      showToast('Please enter valid amounts for LIFT and/or Alumni Association', 'error')
      return
    }

    // Calculate percentages from amounts
    const liftPercentage = (liftAmt / totalAmount) * 100
    const aaPercentage = (aaAmt / totalAmount) * 100

    try {
      const dataToSend = {
        amount: totalAmount,
        date: editForm.date,
        notes: editForm.notes,
        status: editForm.status,
        liftPercentage: liftPercentage,
        aaPercentage: aaPercentage
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
      <ContributionHistoryTable
        contributions={filteredList}
        isAdmin={true}
        onApprove={handleApprove}
        onReject={handleReject}
        onEdit={openEditModal}
        onToggleAudit={toggleAuditHistory}
        auditLogs={auditLogs}
        expandedAudit={expandedAudit}
        loadingAudit={loadingAudit}
        showFilters={false}
        showUserColumn={true}
      />

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
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select type</option>
                  <option value="BASIC">Basic</option>
                  <option value="ADDITIONAL">Additional</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Contribution Amounts *</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">LIFT Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.liftAmount}
                      onChange={(e) => setFormData({ ...formData, liftAmount: e.target.value })}
                      className="w-full p-2 border rounded"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Alumni Association Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.aaAmount}
                      onChange={(e) => setFormData({ ...formData, aaAmount: e.target.value })}
                      className="w-full p-2 border rounded"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {(formData.liftAmount || formData.aaAmount) && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Total: ₹{((Number(formData.liftAmount) || 0) + (Number(formData.aaAmount) || 0)).toLocaleString()}</span>
                      <span className="text-gray-500">
                        ({((Number(formData.liftAmount) || 0) / ((Number(formData.liftAmount) || 0) + (Number(formData.aaAmount) || 0)) * 100 || 0).toFixed(1)}% LIFT / {((Number(formData.aaAmount) || 0) / ((Number(formData.liftAmount) || 0) + (Number(formData.aaAmount) || 0)) * 100 || 0).toFixed(1)}% AA)
                      </span>
                    </div>
                  </div>
                )}
              </div>
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
                      liftAmount: '',
                      aaAmount: '',
                      date: '',
                      notes: '',
                      type: ''
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
                <label className="block text-sm font-medium mb-1">Contribution Amounts *</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">LIFT Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.liftAmount}
                      onChange={(e) => setEditForm({ ...editForm, liftAmount: e.target.value })}
                      className="w-full p-2 border rounded"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Alumni Association Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.aaAmount}
                      onChange={(e) => setEditForm({ ...editForm, aaAmount: e.target.value })}
                      className="w-full p-2 border rounded"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {(editForm.liftAmount || editForm.aaAmount) && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Total: ₹{((Number(editForm.liftAmount) || 0) + (Number(editForm.aaAmount) || 0)).toLocaleString()}</span>
                      <span className="text-gray-500">
                        ({((Number(editForm.liftAmount) || 0) / ((Number(editForm.liftAmount) || 0) + (Number(editForm.aaAmount) || 0)) * 100 || 0).toFixed(1)}% LIFT / {((Number(editForm.aaAmount) || 0) / ((Number(editForm.liftAmount) || 0) + (Number(editForm.aaAmount) || 0)) * 100 || 0).toFixed(1)}% AA)
                      </span>
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
