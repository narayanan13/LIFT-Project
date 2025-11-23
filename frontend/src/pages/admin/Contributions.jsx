import React, { useEffect, useState } from 'react'
import api from '../../api'
import ToastNotification from '../../components/ToastNotification'

export default function AdminContributions(){
  const [list, setList] = useState([])
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ userId: '', amount: '', date: '', notes: '' })

  // Toast state
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    fetchContributions()
    fetchUsers()
  }, [])

  const fetchContributions = () => {
    api.get('/admin/contributions').then(r => setList(r.data))
  }

  const fetchUsers = () => {
    api.get('/admin/users').then(r => setUsers(r.data))
  }

  function showToast(message, type='info'){
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.userId || !formData.amount || !formData.date) {
      showToast('Please fill in all required fields', 'error')
      return
    }
    if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
      showToast('Please enter a valid positive number for amount', 'error')
      return
    }
    try {
      await api.post('/admin/contributions', formData)
      setShowModal(false)
      setFormData({ userId: '', amount: '', date: '', notes: '' })
      fetchContributions()
      showToast('Contribution added successfully', 'success')
    } catch (error) {
      showToast('Failed to add contribution', 'error')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Contributions</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Contribution
        </button>
      </div>
      <div className="space-y-2">
        {list.map(c => (
          <div key={c.id} className="p-3 bg-white rounded shadow-sm">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{c.user?.name}</div>
                <div className="text-sm text-gray-500">{new Date(c.date).toLocaleDateString()}</div>
              </div>
              <div className="font-semibold text-green-600">${c.amount}</div>
            </div>
            {c.notes && <div className="text-sm text-gray-600 mt-1">{c.notes}</div>}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Add New Contribution</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">User</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
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
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows="3"
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
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            </form>
            <ToastNotification
              message={toastMessage}
              type={toastType}
              visible={toastVisible}
              onClose={() => setToastVisible(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
