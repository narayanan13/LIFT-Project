import React, { useEffect, useState } from 'react';
import api from '../../api';
import { FaHistory, FaPlus } from 'react-icons/fa';
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

function TypeBadge({ type }) {
  const styles = {
    BASIC: 'bg-indigo-100 text-indigo-800',
    ADDITIONAL: 'bg-teal-100 text-teal-800'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100'}`}>
      {type}
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

export default function AlumniContributions() {
  const [contribs, setContribs] = useState({ total: 0, pendingTotal: 0, liftTotal: 0, aaTotal: 0, contributions: [] });
  const [loading, setLoading] = useState(true);

  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newType, setNewType] = useState('');
  const [newBucket, setNewBucket] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const [toastVisible, setToastVisible] = useState(false);
  const [splitPercentage, setSplitPercentage] = useState(50);

  useEffect(() => {
    fetchContributions();
    fetchSplitSetting();
  }, []);

  async function fetchContributions() {
    try {
      setLoading(true);
      const c = await api.get('/alumni/contributions');
      setContribs(c.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSplitSetting() {
    try {
      const res = await api.get('/admin/settings/basic_contribution_split_lift');
      setSplitPercentage(parseFloat(res.data.value));
    } catch (err) {
      // Use default 50% if setting not found
      console.log('Using default split percentage');
    }
  }

  async function handleAddContribution(e) {
    e.preventDefault();
    if (!newAmount || isNaN(newAmount) || Number(newAmount) <= 0) {
      showToast('Please enter a valid positive amount', 'error');
      return;
    }
    if (!newType) {
      showToast('Please select a contribution type', 'error');
      return;
    }
    if (newType === 'ADDITIONAL' && !newBucket) {
      showToast('Please select a bucket for ADDITIONAL contributions', 'error');
      return;
    }
    setAdding(true);
    try {
      await api.post('/alumni/contributions', {
        amount: Number(newAmount),
        date: newDate,
        type: newType,
        bucket: newType === 'ADDITIONAL' ? newBucket : undefined,
        notes: newNotes || undefined
      });
      showToast('Contribution submitted! It will appear once approved by an admin.', 'success');
      setNewAmount('');
      setNewDate(new Date().toISOString().split('T')[0]);
      setNewType('');
      setNewBucket('');
      setNewNotes('');
      await fetchContributions();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add contribution', 'error');
    } finally {
      setAdding(false);
    }
  }

  function showToast(message, type = 'info') {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }

  // Calculate monthly and yearly contribution sums (only approved)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyContribution = contribs.contributions
    .filter(c => {
      const d = new Date(c.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && c.status === 'APPROVED';
    })
    .reduce((sum, c) => sum + c.amount, 0);

  const yearlyContribution = contribs.contributions
    .filter(c => {
      const d = new Date(c.date);
      return d.getFullYear() === currentYear && c.status === 'APPROVED';
    })
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 bg-transparent">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">My Contributions</h1>
          <p className="text-soft-peach">Add new contributions and view your contribution history</p>
        </div>

        {/* Contribution summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center justify-center">
            <div className="text-sm font-semibold text-gray-700 mb-2">This Month</div>
            <div className="text-xl font-bold text-deep-red">₹{monthlyContribution.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">Approved</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center justify-center">
            <div className="text-sm font-semibold text-gray-700 mb-2">This Year</div>
            <div className="text-xl font-bold text-deep-red">₹{yearlyContribution.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">Approved</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center justify-center">
            <div className="text-sm font-semibold text-gray-700 mb-2">Total Approved</div>
            <div className="text-xl font-bold text-green-600">₹{contribs.total.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center justify-center border-l-4 border-blue-400">
            <div className="text-sm font-semibold text-gray-700 mb-2">LIFT</div>
            <div className="text-xl font-bold text-blue-600">₹{(contribs.liftTotal || 0).toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">Approved</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center justify-center border-l-4 border-purple-400">
            <div className="text-sm font-semibold text-gray-700 mb-2">Alumni Assoc.</div>
            <div className="text-xl font-bold text-purple-600">₹{(contribs.aaTotal || 0).toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">Approved</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center justify-center border-l-4 border-yellow-400">
            <div className="text-sm font-semibold text-gray-700 mb-2">Pending</div>
            <div className="text-xl font-bold text-yellow-600">₹{(contribs.pendingTotal || 0).toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">Awaiting</div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-red"></div>
          </div>
        ) : (
          <>
            {/* Contribution addition form */}
            <div className="mb-8 p-6 bg-white rounded-2xl shadow-sm max-w-lg">
              <div className="flex items-center mb-4">
                <FaPlus className="text-deep-red mr-2" />
                <h2 className="text-xl font-semibold">Add New Contribution</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Your contribution will be reviewed by an admin before it's approved.
              </p>
              <form onSubmit={handleAddContribution} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={newType}
                    onChange={e => {
                      setNewType(e.target.value);
                      if (e.target.value === 'BASIC') setNewBucket('');
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                    disabled={adding}
                  >
                    <option value="">Select type</option>
                    <option value="BASIC">Basic</option>
                    <option value="ADDITIONAL">Additional</option>
                  </select>
                </div>
                {newType === 'ADDITIONAL' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bucket *</label>
                    <select
                      value={newBucket}
                      onChange={e => setNewBucket(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                      disabled={adding}
                    >
                      <option value="">Select bucket</option>
                      <option value="LIFT">LIFT</option>
                      <option value="ALUMNI_ASSOCIATION">Alumni Association</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={newAmount}
                    min={0}
                    step="0.01"
                    onChange={e => setNewAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                    disabled={adding}
                  />
                </div>
                {newType === 'BASIC' && newAmount && (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="text-sm font-medium text-gray-700 mb-2">Split Preview</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        <span>LIFT ({splitPercentage}%): </span>
                        <span className="font-semibold">₹{(Number(newAmount) * splitPercentage / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                        <span>AA ({100 - splitPercentage}%): </span>
                        <span className="font-semibold">₹{(Number(newAmount) * (100 - splitPercentage) / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
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
                <button
                  type="submit"
                  disabled={adding}
                  className="w-full bg-deep-red hover:bg-warm-red text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {adding ? 'Submitting...' : 'Submit Contribution'}
                </button>
              </form>
              <ToastNotification
                message={toastMessage}
                type={toastType}
                visible={toastVisible}
                onClose={() => setToastVisible(false)}
              />
            </div>

            {/* Contribution history */}
            <div className="bg-white rounded-2xl shadow-sm p-6 max-w-4xl">
              <div className="flex items-center mb-4">
                <FaHistory className="text-warm-red mr-2" />
                <h2 className="text-xl font-semibold text-deep-red">Contribution History</h2>
              </div>
              <div className="space-y-3">
                {contribs.contributions.length > 0 ? (
                  contribs.contributions.map(c => (
                    <div key={c.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                          <div className="font-semibold text-lg text-deep-red">₹{c.amount.toLocaleString()}</div>
                          <TypeBadge type={c.type} />
                          {c.type === 'ADDITIONAL' && <BucketBadge bucket={c.bucket} />}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm text-gray-500">{new Date(c.date).toLocaleDateString()}</div>
                          <StatusBadge status={c.status} />
                        </div>
                      </div>
                      {c.type === 'BASIC' && (
                        <div className="mt-2 text-xs text-gray-500 flex gap-4">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            LIFT: ₹{(c.liftAmount || 0).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            AA: ₹{(c.aaAmount || 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {c.notes && <div className="mt-2 text-sm text-gray-600">{c.notes}</div>}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No contributions yet. Add your first contribution above!</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
