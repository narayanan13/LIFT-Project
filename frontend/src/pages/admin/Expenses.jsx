import React, { useEffect, useState } from 'react'
import api from '../../api'
import AuditLogTable from '../../components/AuditLogTable'

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800'
  }
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  )
}

export default function AdminExpenses(){
  const [list, setList] = useState([])
  const [events, setEvents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [filterEvent, setFilterEvent] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [formData, setFormData] = useState({ amount: '', vendor: '', purpose: '', description: '', date: '', category: '', eventId: '' })
  const [editFormData, setEditFormData] = useState({ amount: '', vendor: '', purpose: '', description: '', date: '', category: '', eventId: '' })
  const [bulkExpenses, setBulkExpenses] = useState([{ amount: '', vendor: '', purpose: '', description: '', date: '', category: '' }])
  const [auditLogs, setAuditLogs] = useState({})
  const [expandedAudit, setExpandedAudit] = useState(null)
  const [loadingAudit, setLoadingAudit] = useState(false)

  useEffect(() => {
    fetchExpenses()
    fetchEvents()
  }, [])

  const fetchExpenses = () => {
    api.get('/admin/expenses').then(r => setList(r.data)).catch(() => console.error('Failed to fetch expenses'))
  }

  const fetchEvents = () => {
    api.get('/admin/events').then(r => setEvents(r.data)).catch(() => console.error('Failed to fetch events'))
  }

  const fetchAuditLogs = async (expenseId) => {
    setLoadingAudit(true)
    try {
      const response = await api.get(`/admin/expenses/${expenseId}/audit-logs`)
      setAuditLogs(prev => ({ ...prev, [expenseId]: response.data }))
    } catch (error) {
      console.error('Failed to fetch audit logs', error)
      alert('Failed to load audit history')
    } finally {
      setLoadingAudit(false)
    }
  }

  const toggleAuditHistory = (expenseId) => {
    if (expandedAudit === expenseId) {
      setExpandedAudit(null)
    } else {
      setExpandedAudit(expenseId)
      if (!auditLogs[expenseId]) {
        fetchAuditLogs(expenseId)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.amount || !formData.purpose || !formData.date || !formData.category) {
      alert('Please fill in all required fields')
      return
    }
    try {
      await api.post('/admin/expenses', formData)
      setShowModal(false)
      setFormData({ amount: '', vendor: '', purpose: '', description: '', date: '', category: '', eventId: '' })
      fetchExpenses()
    } catch (error) {
      alert('Failed to add expense')
    }
  }

  const handleBulkSubmit = async (e) => {
    e.preventDefault()
    const validExpenses = bulkExpenses.filter(exp => exp.amount && exp.purpose && exp.date && exp.category)
    if (validExpenses.length === 0) {
      alert('Please fill in at least one expense')
      return
    }
    try {
      await api.post('/admin/expenses/bulk', {
        expenses: validExpenses.map(exp => ({ ...exp, eventId: selectedEvent }))
      })
      setShowBulkModal(false)
      setBulkExpenses([{ amount: '', vendor: '', purpose: '', description: '', date: '', category: '' }])
      setSelectedEvent(null)
      fetchExpenses()
    } catch (error) {
      alert('Failed to add expenses')
    }
  }

  const handleAddBulkRow = () => {
    setBulkExpenses([...bulkExpenses, { amount: '', vendor: '', purpose: '', description: '', date: '', category: '' }])
  }

  const handleRemoveBulkRow = (index) => {
    setBulkExpenses(bulkExpenses.filter((_, i) => i !== index))
  }

  const handleBulkRowChange = (index, field, value) => {
    const updated = [...bulkExpenses]
    updated[index][field] = value
    setBulkExpenses(updated)
  }

  const handleDeleteExpense = async (id) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/admin/expenses/${id}`)
        fetchExpenses()
      } catch (error) {
        alert('Failed to delete expense')
      }
    }
  }

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/expenses/${id}/approve`)
      fetchExpenses()
    } catch (error) {
      alert('Failed to approve expense')
    }
  }

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/expenses/${id}/reject`)
      fetchExpenses()
    } catch (error) {
      alert('Failed to reject expense')
    }
  }

  const handleEditClick = (expense) => {
    setEditingExpense(expense)
    setEditFormData({
      amount: expense.amount,
      vendor: expense.vendor || '',
      purpose: expense.purpose,
      description: expense.description || '',
      date: expense.date.split('T')[0],
      category: expense.category,
      eventId: expense.eventId || ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editFormData.amount || !editFormData.purpose || !editFormData.date || !editFormData.category) {
      alert('Please fill in all required fields')
      return
    }
    try {
      await api.put(`/admin/expenses/${editingExpense.id}`, editFormData)
      setShowEditModal(false)
      setEditingExpense(null)
      setEditFormData({ amount: '', vendor: '', purpose: '', description: '', date: '', category: '', eventId: '' })
      fetchExpenses()
    } catch (error) {
      alert('Failed to update expense')
    }
  }

  let filteredList = list
  if (filterEvent !== 'all') {
    filteredList = filterEvent === 'none'
      ? filteredList.filter(e => !e.eventId)
      : filteredList.filter(e => e.eventId === filterEvent)
  }
  if (filterStatus !== 'all') {
    filteredList = filteredList.filter(e => e.status === filterStatus)
  }

  const pendingCount = list.filter(e => e.status === 'PENDING').length

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add Multiple
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Add Expense
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Filter by Status</label>
          <div className="flex gap-2">
            {['all', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded text-sm ${
                  filterStatus === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status === 'all' ? 'All' : status}
                {status === 'PENDING' && pendingCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white rounded-full px-2 text-xs">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Filter by Event/Group</label>
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="p-2 border rounded w-full md:w-64"
          >
            <option value="all">All Expenses</option>
            <option value="none">No Event/Group</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {filteredList.map(e => (
          <React.Fragment key={e.id}>
            <div className={`p-3 bg-white rounded shadow-sm flex justify-between items-start border-l-4 ${
              e.status === 'PENDING' ? 'border-yellow-400' :
              e.status === 'APPROVED' ? 'border-green-400' : 'border-red-400'
            }`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{e.category} - {e.purpose}</span>
                <StatusBadge status={e.status} />
              </div>
              {e.vendor && <div className="text-sm text-gray-600">Vendor: {e.vendor}</div>}
              <div className="text-sm text-gray-500">{new Date(e.date).toLocaleDateString()}</div>
              {e.event && <div className="text-sm text-blue-600">Group: {e.event.name}</div>}
              {e.submitter && <div className="text-sm text-purple-600">Submitted by: {e.submitter.name}</div>}
              {e.description && <div className="text-sm text-gray-600 mt-1">{e.description}</div>}
            </div>
            <div className="flex items-center gap-2">
              <div className="font-semibold text-red-600">₹{e.amount}</div>
              {e.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleApprove(e.id)}
                    className="px-3 py-1 bg-green-100 text-green-600 rounded text-sm hover:bg-green-200"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(e.id)}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => handleEditClick(e)}
                className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200"
              >
                Edit
              </button>
               <button
                 onClick={() => handleDeleteExpense(e.id)}
                 className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200"
               >
                 Delete
               </button>
               <button
                 onClick={() => toggleAuditHistory(e.id)}
                 className="px-3 py-1 bg-purple-100 text-purple-600 rounded text-sm hover:bg-purple-200"
               >
                 {expandedAudit === e.id ? 'Hide History' : 'View History'}
               </button>
              </div>
            </div>
            {expandedAudit === e.id && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                {loadingAudit && expandedAudit === e.id ? (
                  <div className="text-center py-4">
                    <span className="text-gray-500">Loading audit history...</span>
                  </div>
                ) : (
                  <AuditLogTable auditLogs={auditLogs[e.id] || []} />
                )}
              </div>
            )}
          </React.Fragment>
        ))}
         {filteredList.length === 0 && <p className="text-gray-500">No expenses found</p>}
       </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Add New Expense</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Vendor</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Amazon, Local Store"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Purpose *</label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Office Supplies, Event Catering"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows="3"
                  placeholder="Any additional details..."
                />
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
                <label className="block text-sm font-medium mb-1">Category *</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Office, Event"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Event/Group (Optional)</label>
                <select
                  value={formData.eventId}
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Select Event/Group --</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Expense</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Vendor</label>
                <input
                  type="text"
                  value={editFormData.vendor}
                  onChange={(e) => setEditFormData({ ...editFormData, vendor: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Amazon, Local Store"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Purpose *</label>
                <input
                  type="text"
                  value={editFormData.purpose}
                  onChange={(e) => setEditFormData({ ...editFormData, purpose: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Office Supplies, Event Catering"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows="3"
                  placeholder="Any additional details..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Category *</label>
                <input
                  type="text"
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Office, Event"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Event/Group (Optional)</label>
                <select
                  value={editFormData.eventId}
                  onChange={(e) => setEditFormData({ ...editFormData, eventId: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Select Event/Group --</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingExpense(null)
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Add Multiple Expenses</h3>
            <form onSubmit={handleBulkSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Event/Group (Optional)</label>
                <select
                  value={selectedEvent || ''}
                  onChange={(e) => setSelectedEvent(e.target.value || null)}
                  className="p-2 border rounded w-full"
                >
                  <option value="">-- No Event/Group --</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="p-2 text-left">Amount</th>
                      <th className="p-2 text-left">Vendor</th>
                      <th className="p-2 text-left">Purpose</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Category</th>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkExpenses.map((exp, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            value={exp.amount}
                            onChange={(e) => handleBulkRowChange(index, 'amount', e.target.value)}
                            className="w-full p-1 border rounded text-sm"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={exp.vendor}
                            onChange={(e) => handleBulkRowChange(index, 'vendor', e.target.value)}
                            className="w-full p-1 border rounded text-sm"
                            placeholder="Vendor"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={exp.purpose}
                            onChange={(e) => handleBulkRowChange(index, 'purpose', e.target.value)}
                            className="w-full p-1 border rounded text-sm"
                            placeholder="Purpose"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            value={exp.date}
                            onChange={(e) => handleBulkRowChange(index, 'date', e.target.value)}
                            className="w-full p-1 border rounded text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={exp.category}
                            onChange={(e) => handleBulkRowChange(index, 'category', e.target.value)}
                            className="w-full p-1 border rounded text-sm"
                            placeholder="Category"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={exp.description}
                            onChange={(e) => handleBulkRowChange(index, 'description', e.target.value)}
                            className="w-full p-1 border rounded text-sm"
                            placeholder="Description"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveBulkRow(index)}
                            className="px-2 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mb-4">
                <button
                  type="button"
                  onClick={handleAddBulkRow}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  + Add Row
                </button>
                <span className="text-sm text-gray-600">{bulkExpenses.filter(e => e.amount && e.purpose && e.date && e.category).length} valid expense(s)</span>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false)
                    setBulkExpenses([{ amount: '', vendor: '', purpose: '', description: '', date: '', category: '' }])
                    setSelectedEvent(null)
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Add All
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
