import React, { useEffect, useState } from 'react'
import api from '../../api'

export default function AdminExpenses(){
  const [list, setList] = useState([])
  const [events, setEvents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [filterEvent, setFilterEvent] = useState('all')
  const [formData, setFormData] = useState({ amount: '', purpose: '', description: '', date: '', category: '', eventId: '' })
  const [bulkExpenses, setBulkExpenses] = useState([{ amount: '', purpose: '', description: '', date: '', category: '' }])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.amount || !formData.purpose || !formData.date || !formData.category) {
      alert('Please fill in all required fields')
      return
    }
    try {
      await api.post('/admin/expenses', formData)
      setShowModal(false)
      setFormData({ amount: '', purpose: '', description: '', date: '', category: '', eventId: '' })
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
      setBulkExpenses([{ amount: '', purpose: '', description: '', date: '', category: '' }])
      setSelectedEvent(null)
      fetchExpenses()
    } catch (error) {
      alert('Failed to add expenses')
    }
  }

  const handleAddBulkRow = () => {
    setBulkExpenses([...bulkExpenses, { amount: '', purpose: '', description: '', date: '', category: '' }])
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

  const filteredList = filterEvent === 'all' ? list : filterEvent === 'none' ? list.filter(e => !e.eventId) : list.filter(e => e.eventId === filterEvent)

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

      <div className="mb-4">
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

      <div className="space-y-2">
        {filteredList.map(e => (
          <div key={e.id} className="p-3 bg-white rounded shadow-sm flex justify-between items-start border-l-4 border-red-400">
            <div>
              <div className="font-semibold">{e.category} - {e.purpose}</div>
              <div className="text-sm text-gray-500">{new Date(e.date).toLocaleDateString()}</div>
              {e.event && <div className="text-sm text-blue-600">Group: {e.event.name}</div>}
              {e.description && <div className="text-sm text-gray-600 mt-1">{e.description}</div>}
            </div>
            <div className="flex items-center gap-4">
            <div className="font-semibold text-red-600">₹{e.amount}</div>
              <button
                onClick={() => handleDeleteExpense(e.id)}
                className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filteredList.length === 0 && <p className="text-gray-500">No expenses found</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-96 overflow-y-auto">
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

      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-96 overflow-y-auto">
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
                    setBulkExpenses([{ amount: '', purpose: '', description: '', date: '', category: '' }])
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
