import React, { useEffect, useState } from 'react'
import api from '../../api'

export default function AdminExpenses(){
  const [list, setList] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ amount: '', purpose: '', description: '', date: '', category: '', event: '' })

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = () => {
    api.get('/admin/expenses').then(r => setList(r.data))
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
      setFormData({ amount: '', purpose: '', description: '', date: '', category: '', event: '' })
      fetchExpenses()
    } catch (error) {
      alert('Failed to add expense')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Add Expense
        </button>
      </div>
      <div className="space-y-2">
        {list.map(e => (
          <div key={e.id} className="p-3 bg-white rounded shadow-sm">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{e.category} - {e.purpose}</div>
                <div className="text-sm text-gray-500">{new Date(e.date).toLocaleDateString()}</div>
                {e.event && <div className="text-sm text-gray-500">Event: {e.event}</div>}
              </div>
              <div className="font-semibold text-red-600">${e.amount}</div>
            </div>
            {e.description && <div className="text-sm text-gray-600 mt-1">{e.description}</div>}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Add New Expense</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Amount</label>
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
                <label className="block text-sm font-medium mb-1">Purpose</label>
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
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Category</label>
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
                <label className="block text-sm font-medium mb-1">Event (Optional)</label>
                <input
                  type="text"
                  value={formData.event}
                  onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Alumni Reunion 2023"
                />
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
    </div>
  )
}
