import React, { useEffect, useState } from 'react'
import api from '../../api'
import { FaUser, FaEdit } from 'react-icons/fa'
import ToastNotification from '../../components/ToastNotification'
import AlumniProfile from '../alumni/AlumniProfile'

export default function AdminProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '' })

  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('error')
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      setLoading(true)
      const res = await api.get('/auth/me')
      setUser(res.data)
    } catch (err) {
      showToast('Failed to load profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  function showToast(message, type = 'info') {
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  function openEdit() {
    setFormData({ name: user.name || '', email: user.email || '' })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Name and email are required', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await api.put('/auth/profile', formData)
      // Update localStorage with new user info and token
      const stored = JSON.parse(localStorage.getItem('user'))
      localStorage.setItem('user', JSON.stringify({
        ...stored,
        ...res.data.user,
        token: res.data.token
      }))
      setUser(res.data.user)
      setShowModal(false)
      showToast('Profile updated successfully', 'success')
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const positionLabels = {
    PRESIDENT: 'President',
    VICE_PRESIDENT: 'Vice President',
    SECRETARY: 'Secretary',
    JOINT_SECRETARY: 'Joint Secretary',
    TREASURER: 'Treasurer'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-red"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 bg-transparent">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">My Profile</h1>
          <p className="text-soft-peach">Manage your account details, education, and career history</p>
        </div>

        {user && (
          <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-deep-red rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                  {user.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                  <p className="text-gray-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={openEdit}
                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                title="Edit profile"
              >
                <FaEdit className="text-lg" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Role</div>
                <div className="font-medium">
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                    {user.role}
                  </span>
                </div>
              </div>
              {user.officePosition && (
                <div>
                  <div className="text-sm text-gray-500">Office Position</div>
                  <div className="font-medium">
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                      {positionLabels[user.officePosition] || user.officePosition}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Education, Contact & Career History */}
        <div className="mt-8">
          <AlumniProfile hidePageHeader />
        </div>

        {/* Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md mx-4">
              <div className="flex items-center mb-4">
                <FaUser className="text-deep-red mr-2" />
                <h2 className="text-xl font-semibold">Edit Profile</h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                    disabled={saving}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                    disabled={saving}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-deep-red text-white rounded-lg hover:bg-warm-red transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ToastNotification
          message={toastMessage}
          type={toastType}
          visible={toastVisible}
          onClose={() => setToastVisible(false)}
        />
      </div>
    </div>
  )
}
