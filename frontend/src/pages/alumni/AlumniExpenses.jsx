import React, { useEffect, useState } from 'react';
import api from '../../api';
import { FaHistory, FaPlus, FaEdit } from 'react-icons/fa';
import ToastNotification from '../../components/ToastNotification';

function StatusBadge({ status }) {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function BucketBadge({ bucket }) {
  const styles = {
    LIFT: 'bg-blue-100 text-blue-800',
    ALUMNI_ASSOCIATION: 'bg-purple-100 text-purple-800'
  };
  const labels = {
    LIFT: 'LIFT',
    ALUMNI_ASSOCIATION: 'Alumni Assoc.'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[bucket] || 'bg-gray-100'}`}>
      {labels[bucket] || bucket}
    </span>
  );
}

export default function AlumniExpenses() {
  const [expenses, setExpenses] = useState({ expenses: [], approvedTotal: 0, pendingTotal: 0, rejectedTotal: 0, liftTotal: 0, aaTotal: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    amount: '',
    vendor: '',
    purpose: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    bucket: '',
    eventId: ''
  });
  const [adding, setAdding] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const [toastVisible, setToastVisible] = useState(false);

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    vendor: '',
    purpose: '',
    description: '',
    date: '',
    category: '',
    bucket: '',
    eventId: ''
  });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchExpenses();
    fetchEvents();
  }, []);

  async function fetchExpenses() {
    try {
      setLoading(true);
      const res = await api.get('/alumni/expenses');
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEvents() {
    try {
      const res = await api.get('/alumni/events');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.amount || !formData.purpose || !formData.date || !formData.category || !formData.bucket) {
      showToast('Please fill in all required fields including bucket', 'error');
      return;
    }
    if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
      showToast('Please enter a valid positive amount', 'error');
      return;
    }
    setAdding(true);
    try {
      await api.post('/alumni/expenses', {
        ...formData,
        amount: Number(formData.amount),
        eventId: formData.eventId || null
      });
      showToast('Expense submitted! It will appear once approved by an admin.', 'success');
      setFormData({
        amount: '',
        vendor: '',
        purpose: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        bucket: '',
        eventId: ''
      });
      await fetchExpenses();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit expense', 'error');
    } finally {
      setAdding(false);
    }
  }

  function handleEditClick(expense) {
    setEditingExpense(expense);
    setEditFormData({
      amount: expense.amount,
      vendor: expense.vendor || '',
      purpose: expense.purpose,
      description: expense.description || '',
      date: expense.date.split('T')[0],
      category: expense.category,
      bucket: expense.bucket || 'LIFT',
      eventId: expense.eventId || ''
    });
    setShowEditModal(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editFormData.amount || !editFormData.purpose || !editFormData.date || !editFormData.category || !editFormData.bucket) {
      showToast('Please fill in all required fields including bucket', 'error');
      return;
    }
    if (isNaN(editFormData.amount) || Number(editFormData.amount) <= 0) {
      showToast('Please enter a valid positive amount', 'error');
      return;
    }
    setEditing(true);
    try {
      await api.put(`/alumni/expenses/${editingExpense.id}`, {
        ...editFormData,
        amount: Number(editFormData.amount),
        eventId: editFormData.eventId || null
      });
      showToast('Expense updated successfully!', 'success');
      setShowEditModal(false);
      setEditingExpense(null);
      setEditFormData({
        amount: '',
        vendor: '',
        purpose: '',
        description: '',
        date: '',
        category: '',
        bucket: '',
        eventId: ''
      });
      await fetchExpenses();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update expense', 'error');
    } finally {
      setEditing(false);
    }
  }

  function showToast(message, type = 'info') {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 bg-transparent">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">My Expenses</h1>
          <p className="text-soft-peach">Submit expenses for approval and track your expense history</p>
        </div>

        {/* Expense summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center justify-center border-l-4 border-green-400">
            <div className="text-sm font-semibold text-gray-700 mb-2">Approved</div>
            <div className="text-xl font-bold text-green-600">₹{expenses.approvedTotal.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center justify-center border-l-4 border-blue-400">
            <div className="text-sm font-semibold text-gray-700 mb-2">LIFT</div>
            <div className="text-xl font-bold text-blue-600">₹{(expenses.liftTotal || 0).toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">Approved</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center justify-center border-l-4 border-purple-400">
            <div className="text-sm font-semibold text-gray-700 mb-2">Alumni Assoc.</div>
            <div className="text-xl font-bold text-purple-600">₹{(expenses.aaTotal || 0).toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">Approved</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center justify-center border-l-4 border-yellow-400">
            <div className="text-sm font-semibold text-gray-700 mb-2">Pending</div>
            <div className="text-xl font-bold text-yellow-600">₹{expenses.pendingTotal.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">Awaiting</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center justify-center border-l-4 border-red-400">
            <div className="text-sm font-semibold text-gray-700 mb-2">Rejected</div>
            <div className="text-xl font-bold text-red-600">₹{expenses.rejectedTotal.toFixed(2)}</div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-red"></div>
          </div>
        ) : (
          <>
            {/* Expense submission form */}
            <div className="mb-8 p-6 bg-white rounded-2xl shadow-sm max-w-lg">
              <div className="flex items-center mb-4">
                <FaPlus className="text-deep-red mr-2" />
                <h2 className="text-xl font-semibold">Submit New Expense</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Your expense will be reviewed by an admin before it's approved.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={formData.amount}
                      min={0}
                      step="0.01"
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                      disabled={adding}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                      disabled={adding}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <input
                    type="text"
                    placeholder="e.g., Amazon, Local Store"
                    value={formData.vendor}
                    onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                    disabled={adding}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
                  <input
                    type="text"
                    placeholder="e.g., Office Supplies, Event Catering"
                    value={formData.purpose}
                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                    disabled={adding}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <input
                    type="text"
                    placeholder="e.g., Office, Event, Travel"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                    disabled={adding}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bucket *</label>
                  <select
                    value={formData.bucket}
                    onChange={e => setFormData({ ...formData, bucket: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                    disabled={adding}
                    required
                  >
                    <option value="">-- Select Bucket --</option>
                    <option value="LIFT">LIFT</option>
                    <option value="ALUMNI_ASSOCIATION">Alumni Association</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event/Group (Optional)</label>
                  <select
                    value={formData.eventId}
                    onChange={e => setFormData({ ...formData, eventId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                    disabled={adding}
                  >
                    <option value="">-- Select Event/Group --</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    placeholder="Any additional details..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                    rows="2"
                    disabled={adding}
                  />
                </div>
                <button
                  type="submit"
                  disabled={adding}
                  className="w-full bg-deep-red hover:bg-warm-red text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {adding ? 'Submitting...' : 'Submit Expense'}
                </button>
              </form>
              <ToastNotification
                message={toastMessage}
                type={toastType}
                visible={toastVisible}
                onClose={() => setToastVisible(false)}
              />
            </div>

            {/* Expense history */}
            <div className="bg-white rounded-2xl shadow-sm p-6 max-w-3xl">
              <div className="flex items-center mb-4">
                <FaHistory className="text-warm-red mr-2" />
                <h2 className="text-xl font-semibold text-deep-red">Expense History</h2>
              </div>
              <div className="space-y-3">
                {expenses.expenses.length > 0 ? (
                  expenses.expenses.map(exp => (
                    <div key={exp.id} className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors border-l-4 ${
                      exp.status === 'PENDING' ? 'border-l-yellow-400' :
                      exp.status === 'APPROVED' ? 'border-l-green-400' : 'border-l-red-400'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-deep-red">{exp.category} - {exp.purpose}</span>
                            <StatusBadge status={exp.status} />
                            <BucketBadge bucket={exp.bucket} />
                          </div>
                          {exp.vendor && <div className="text-sm text-gray-600">Vendor: {exp.vendor}</div>}
                          <div className="text-sm text-gray-500">{new Date(exp.date).toLocaleDateString()}</div>
                          {exp.event && <div className="text-sm text-blue-600">Group: {exp.event.name}</div>}
                          {exp.description && <div className="text-sm text-gray-600 mt-1">{exp.description}</div>}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-lg text-red-600">₹{exp.amount.toLocaleString()}</div>
                          {exp.status === 'PENDING' && (
                            <button
                              onClick={() => handleEditClick(exp)}
                              className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                              title="Edit expense"
                            >
                              <FaEdit />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No expenses yet. Submit your first expense above!</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex items-center mb-4">
                <FaEdit className="text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold">Edit Expense</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                You can edit this expense while it's still pending approval.
              </p>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={editFormData.amount}
                      min={0}
                      step="0.01"
                      onChange={e => setEditFormData({ ...editFormData, amount: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={editing}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={editFormData.date}
                      onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={editing}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <input
                    type="text"
                    placeholder="e.g., Amazon, Local Store"
                    value={editFormData.vendor}
                    onChange={e => setEditFormData({ ...editFormData, vendor: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={editing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
                  <input
                    type="text"
                    placeholder="e.g., Office Supplies, Event Catering"
                    value={editFormData.purpose}
                    onChange={e => setEditFormData({ ...editFormData, purpose: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={editing}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <input
                    type="text"
                    placeholder="e.g., Office, Event, Travel"
                    value={editFormData.category}
                    onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={editing}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bucket *</label>
                  <select
                    value={editFormData.bucket}
                    onChange={e => setEditFormData({ ...editFormData, bucket: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={editing}
                    required
                  >
                    <option value="">-- Select Bucket --</option>
                    <option value="LIFT">LIFT</option>
                    <option value="ALUMNI_ASSOCIATION">Alumni Association</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event/Group (Optional)</label>
                  <select
                    value={editFormData.eventId}
                    onChange={e => setEditFormData({ ...editFormData, eventId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={editing}
                  >
                    <option value="">-- Select Event/Group --</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    placeholder="Any additional details..."
                    value={editFormData.description}
                    onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    disabled={editing}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingExpense(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    disabled={editing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {editing ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
