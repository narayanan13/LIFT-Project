import React, { useEffect, useState } from 'react'
import api from '../../api'

export default function AlumniActionItems() {
  const [actionItems, setActionItems] = useState([])
  const [filter, setFilter] = useState('all') // all, pending, completed

  useEffect(() => {
    fetchActionItems()
  }, [])

  const fetchActionItems = async () => {
    try {
      const res = await api.get('/alumni/action-items')
      setActionItems(res.data)
    } catch (err) {
      console.error('Failed to fetch action items:', err)
    }
  }

  const handleComplete = async (id) => {
    try {
      await api.put(`/alumni/action-items/${id}/complete`)
      fetchActionItems()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete action item')
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const isOverdue = (targetDate) => {
    return new Date(targetDate) < new Date() && new Date(targetDate).toDateString() !== new Date().toDateString()
  }

  const filteredItems = actionItems.filter(item => {
    if (filter === 'pending') return item.status === 'PENDING'
    if (filter === 'completed') return item.status === 'COMPLETED'
    return true
  })

  const pendingCount = actionItems.filter(i => i.status === 'PENDING').length
  const completedCount = actionItems.filter(i => i.status === 'COMPLETED').length
  const overdueCount = actionItems.filter(i => i.status === 'PENDING' && isOverdue(i.targetDate)).length

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Action Items</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <div className="text-2xl font-bold text-red-700">{overdueCount}</div>
          <div className="text-sm text-red-600">Overdue</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <div className="text-2xl font-bold text-green-700">{completedCount}</div>
          <div className="text-sm text-green-600">Completed</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          All ({actionItems.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded ${filter === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Action items list */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {filter === 'all' ? 'No action items assigned to you' : `No ${filter} action items`}
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className={`p-4 bg-white rounded shadow-sm border ${
                item.status === 'COMPLETED'
                  ? 'border-green-200'
                  : isOverdue(item.targetDate)
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className={`font-medium ${item.status === 'COMPLETED' ? 'line-through text-gray-500' : ''}`}>
                    {item.description}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    From meeting: {item.meeting?.title || 'Untitled Meeting'}
                    {item.meeting?.date && ` (${formatDate(item.meeting.date)})`}
                  </div>
                  <div className="text-sm mt-1">
                    <span className={isOverdue(item.targetDate) && item.status !== 'COMPLETED' ? 'text-red-600 font-medium' : 'text-gray-500'}>
                      Due: {formatDate(item.targetDate)}
                    </span>
                    {isOverdue(item.targetDate) && item.status !== 'COMPLETED' && (
                      <span className="ml-2 text-red-600 text-xs">(Overdue)</span>
                    )}
                  </div>
                  {item.completedAt && (
                    <div className="text-sm text-green-600 mt-1">
                      Completed: {formatDate(item.completedAt)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                  {item.status === 'PENDING' && (
                    <button
                      onClick={() => handleComplete(item.id)}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
