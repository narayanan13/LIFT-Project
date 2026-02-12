import React, { useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import api from '../api'
import ToastNotification from './ToastNotification'

export default function AddContributionModal({ isOpen, onClose, onSuccess }) {
  const [newLiftAmount, setNewLiftAmount] = useState('')
  const [newAaAmount, setNewAaAmount] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newType, setNewType] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [adding, setAdding] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('error')
  const [toastVisible, setToastVisible] = useState(false)

  if (!isOpen) return null

  async function handleAddContribution(e) {
    e.preventDefault()
    const liftAmt = Number(newLiftAmount) || 0
    const aaAmt = Number(newAaAmount) || 0
    const totalAmount = liftAmt + aaAmt

    if (!newType) {
      showToast('Please select a contribution type', 'error')
      return
    }
    if (totalAmount <= 0) {
      showToast('Please enter valid amounts for LIFT and/or Alumni Association', 'error')
      return
    }

    // Calculate percentages from amounts
    const liftPercentage = (liftAmt / totalAmount) * 100
    const aaPercentage = (aaAmt / totalAmount) * 100

    setAdding(true)
    try {
      const dataToSend = {
        amount: totalAmount,
        date: newDate,
        type: newType,
        notes: newNotes || undefined,
        liftPercentage: liftPercentage,
        aaPercentage: aaPercentage
      }
      await api.post('/alumni/contributions', dataToSend)
      showToast('Contribution submitted! It will appear once approved by an admin.', 'success')
      resetForm()
      onSuccess?.()
      setTimeout(onClose, 500)
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add contribution', 'error')
    } finally {
      setAdding(false)
    }
  }

  function showToast(message, type = 'info') {
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  function resetForm() {
    setNewLiftAmount('')
    setNewAaAmount('')
    setNewDate(new Date().toISOString().split('T')[0])
    setNewType('')
    setNewNotes('')
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white p-6 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 pb-4 border-b border-gray-100 -mx-6 px-6">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">Add New Contribution</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Your contribution will be reviewed by an admin before it's approved.
        </p>

        <form onSubmit={handleAddContribution} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
              disabled={adding}
            >
              <option value="">Select type</option>
              <option value="BASIC">Basic</option>
              <option value="ADDITIONAL">Additional</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contribution Amounts *</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">LIFT Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newLiftAmount}
                  min={0}
                  step="0.01"
                  onChange={e => setNewLiftAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                  disabled={adding}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Alumni Association Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newAaAmount}
                  min={0}
                  step="0.01"
                  onChange={e => setNewAaAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                  disabled={adding}
                />
              </div>
            </div>
            {(newLiftAmount || newAaAmount) && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total: ₹{((Number(newLiftAmount) || 0) + (Number(newAaAmount) || 0)).toLocaleString()}</span>
                  <span className="text-gray-500">
                    ({((Number(newLiftAmount) || 0) / ((Number(newLiftAmount) || 0) + (Number(newAaAmount) || 0)) * 100 || 0).toFixed(1)}% LIFT / {((Number(newAaAmount) || 0) / ((Number(newLiftAmount) || 0) + (Number(newAaAmount) || 0)) * 100 || 0).toFixed(1)}% AA)
                  </span>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
              disabled={adding}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
              placeholder="Add any notes..."
              disabled={adding}
            />
          </div>
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={adding}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className="flex-1 bg-deep-red hover:bg-warm-red text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {adding ? 'Submitting...' : 'Submit'}
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
  )
}

