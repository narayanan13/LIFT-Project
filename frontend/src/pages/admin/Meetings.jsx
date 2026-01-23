import React, { useEffect, useState } from 'react'
import api from '../../api'
import RichTextEditor from '../../components/RichTextEditor'
import MultiSelect from '../../components/MultiSelect'

export default function AdminMeetings() {
  const [meetings, setMeetings] = useState([])
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    notes: '',
    participantIds: [],
    actionItems: []
  })

  useEffect(() => {
    fetchMeetings()
    fetchUsers()
  }, [])

  const fetchMeetings = async () => {
    try {
      const res = await api.get('/admin/meetings')
      setMeetings(res.data)
    } catch (err) {
      console.error('Failed to fetch meetings:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data.filter(u => u.active))
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      notes: '',
      participantIds: [],
      actionItems: []
    })
    setEditMode(false)
    setSelectedMeeting(null)
  }

  const openCreateModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (meeting) => {
    setFormData({
      title: meeting.title || '',
      date: meeting.date ? meeting.date.split('T')[0] : '',
      startTime: meeting.startTime || '',
      endTime: meeting.endTime || '',
      location: meeting.location || '',
      notes: meeting.notes || '',
      participantIds: meeting.participants?.map(p => p.userId) || [],
      actionItems: meeting.actionItems?.map(ai => ({
        description: ai.description,
        targetDate: ai.targetDate ? ai.targetDate.split('T')[0] : '',
        assigneeIds: ai.assignees?.map(a => a.userId) || [],
        status: ai.status
      })) || []
    })
    setSelectedMeeting(meeting)
    setEditMode(true)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.date || !formData.startTime || !formData.endTime || !formData.location) {
      alert('Date, start time, end time, and location are required')
      return
    }

    try {
      if (editMode && selectedMeeting) {
        await api.put(`/admin/meetings/${selectedMeeting.id}`, formData)
      } else {
        await api.post('/admin/meetings', formData)
      }
      setShowModal(false)
      resetForm()
      fetchMeetings()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save meeting')
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      try {
        await api.delete(`/admin/meetings/${id}`)
        fetchMeetings()
      } catch (err) {
        alert('Failed to delete meeting')
      }
    }
  }

  const handleViewDetails = (meeting) => {
    setSelectedMeeting(meeting)
    setShowDetails(true)
  }

  const addActionItem = () => {
    setFormData({
      ...formData,
      actionItems: [...formData.actionItems, { description: '', targetDate: '', assigneeIds: [] }]
    })
  }

  const updateActionItem = (index, field, value) => {
    const updated = [...formData.actionItems]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, actionItems: updated })
  }

  const removeActionItem = (index) => {
    setFormData({
      ...formData,
      actionItems: formData.actionItems.filter((_, i) => i !== index)
    })
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Meetings</h2>
        <button
          onClick={openCreateModal}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Meeting
        </button>
      </div>

      <div className="space-y-4">
        {meetings.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No meetings yet</div>
        ) : (
          meetings.map(meeting => (
            <div key={meeting.id} className="p-4 bg-white rounded shadow-sm border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {meeting.title || 'Untitled Meeting'}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {formatDate(meeting.date)} | {meeting.startTime} - {meeting.endTime}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Location: {meeting.location}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Created by: {meeting.creator?.name}
                  </div>
                  <div className="mt-2 flex gap-4 text-sm text-gray-500">
                    <span>{meeting.participants?.length || 0} participant(s)</span>
                    <span>{meeting.actionItems?.length || 0} action item(s)</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetails(meeting)}
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200"
                  >
                    View
                  </button>
                  <button
                    onClick={() => openEditModal(meeting)}
                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(meeting.id)}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <h3 className="text-lg font-bold mb-4">
              {editMode ? 'Edit Meeting' : 'Create New Meeting'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Title (Optional)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Monthly Alumni Meeting"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Conference Room A"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Participants</label>
                <MultiSelect
                  options={users}
                  value={formData.participantIds}
                  onChange={(ids) => setFormData({ ...formData, participantIds: ids })}
                  placeholder="Select participants..."
                  labelKey="name"
                  valueKey="id"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <RichTextEditor
                  content={formData.notes}
                  onChange={(notes) => setFormData({ ...formData, notes })}
                  placeholder="Meeting notes... (supports Tamil)"
                />
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Action Items</label>
                  <button
                    type="button"
                    onClick={addActionItem}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Action Item
                  </button>
                </div>
                {formData.actionItems.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded mb-2">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Action Item {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeActionItem(index)}
                        className="text-red-500 text-sm hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateActionItem(index, 'description', e.target.value)}
                      className="w-full p-2 border rounded mb-2"
                      placeholder="Description"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={item.targetDate}
                        onChange={(e) => updateActionItem(index, 'targetDate', e.target.value)}
                        className="p-2 border rounded"
                      />
                      <MultiSelect
                        options={users}
                        value={item.assigneeIds || []}
                        onChange={(ids) => updateActionItem(index, 'assigneeIds', ids)}
                        placeholder="Select assignees..."
                        labelKey="name"
                        valueKey="id"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editMode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetails && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <h3 className="text-lg font-bold mb-2">
              {selectedMeeting.title || 'Untitled Meeting'}
            </h3>
            <div className="text-sm text-gray-500 mb-4">
              {formatDate(selectedMeeting.date)} | {selectedMeeting.startTime} - {selectedMeeting.endTime}
              <br />
              Location: {selectedMeeting.location}
              <br />
              Created by: {selectedMeeting.creator?.name}
            </div>

            {selectedMeeting.participants?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Participants</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMeeting.participants.map(p => (
                    <span key={p.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {p.user.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedMeeting.notes && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Notes</h4>
                <RichTextEditor
                  content={selectedMeeting.notes}
                  readOnly={true}
                />
              </div>
            )}

            {selectedMeeting.actionItems?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Action Items</h4>
                <div className="space-y-2">
                  {selectedMeeting.actionItems.map(item => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className={item.status === 'COMPLETED' ? 'line-through text-gray-500' : ''}>
                            {item.description}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Assigned to: {item.assignees?.map(a => a.user?.name).join(', ') || 'None'} | Due: {formatDate(item.targetDate)}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
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
