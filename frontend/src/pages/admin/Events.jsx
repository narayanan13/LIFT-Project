import React, { useEffect, useState } from 'react'
import api from '../../api'

export default function AdminEvents(){
  const [events, setEvents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', date: '' })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = () => {
    api.get('/admin/events').then(r => setEvents(r.data)).catch(() => console.error('Failed to fetch events'))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name) {
      alert('Event name is required')
      return
    }
    try {
      await api.post('/admin/events', formData)
      setShowModal(false)
      setFormData({ name: '', description: '', date: '' })
      fetchEvents()
    } catch (error) {
      alert('Failed to add event')
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await api.delete(`/admin/events/${id}`)
        fetchEvents()
      } catch (error) {
        alert('Failed to delete event')
      }
    }
  }

  const handleViewDetails = async (event) => {
    try {
      const response = await api.get(`/admin/events/${event.id}`)
      setSelectedEvent(response.data)
      setShowDetails(true)
    } catch (error) {
      alert('Failed to fetch event details')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Events / Groups</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map(event => (
          <div key={event.id} className="p-4 bg-white rounded shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{event.name}</h3>
                {event.date && <div className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</div>}
                {event.description && <div className="text-sm text-gray-600 mt-1">{event.description}</div>}
                <div className="mt-2 text-sm text-gray-500">
                  {event.expenses?.length || 0} expense(s)
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(event)}
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200"
                >
                  View
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Create New Event</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Event Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Alumni Reunion 2024"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Date (Optional)</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows="3"
                  placeholder="Event details..."
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{selectedEvent.name} - Expenses</h3>
            {selectedEvent.expenses && selectedEvent.expenses.length > 0 ? (
              <div className="space-y-2">
                {selectedEvent.expenses.map(exp => (
                  <div key={exp.id} className="p-3 bg-gray-50 rounded border">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-semibold">{exp.category} - {exp.purpose}</div>
                        <div className="text-sm text-gray-500">{new Date(exp.date).toLocaleDateString()}</div>
                      </div>
                      <div className="font-semibold text-red-600">₹{exp.amount}</div>
                    </div>
                    {exp.description && <div className="text-sm text-gray-600 mt-1">{exp.description}</div>}
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-red-600">₹{selectedEvent.expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No expenses for this event</p>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
