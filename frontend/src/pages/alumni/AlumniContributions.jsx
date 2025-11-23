import React, { useEffect, useState } from 'react';
import api from '../../api';
import { FaHistory } from 'react-icons/fa';
import ToastNotification from '../../components/ToastNotification';

export default function AlumniContributions() {
  const [contribs, setContribs] = useState({ total: 0, contributions: [] });
  const [loading, setLoading] = useState(true);

  const [newAmount, setNewAmount] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    fetchContributions();
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

  async function handleAddContribution(e) {
    e.preventDefault();
    setAddError('');
    if (!newAmount || isNaN(newAmount) || Number(newAmount) <= 0) {
      showToast('Negative values are not allowed', 'error');
      return;
    }
    setAdding(true);
    try {
      await api.post('/alumni/contributions', { amount: Number(newAmount) });
      setToastMessage('Contribution added successfully');
      setToastType('success');
      setToastVisible(true);
      setNewAmount('');
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

  // Calculate monthly and yearly contribution sums
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyContribution = contribs.contributions
    .filter(c => {
      const d = new Date(c.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, c) => sum + c.amount, 0);

  const yearlyContribution = contribs.contributions
    .filter(c => {
      const d = new Date(c.date);
      return d.getFullYear() === currentYear;
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center">
            <div className="text-lg font-semibold text-gray-700 mb-2">Monthly Contribution</div>
            <div className="text-2xl font-bold text-deep-red">₹{monthlyContribution.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center">
            <div className="text-lg font-semibold text-gray-700 mb-2">Yearly Contribution</div>
            <div className="text-2xl font-bold text-deep-red">₹{yearlyContribution.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center">
            <div className="text-lg font-semibold text-gray-700 mb-2">Total Contribution</div>
            <div className="text-2xl font-bold text-deep-red">₹{contribs.total.toFixed(2)}</div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-red"></div>
          </div>
        ) : (
          <>
            {/* Contribution addition form */}
            <div className="mb-8 p-4 bg-white rounded shadow max-w-sm">
              <h2 className="text-xl font-semibold mb-4">Add Contribution</h2>
              <form onSubmit={handleAddContribution} className="flex items-center space-x-4">
                <input
                  type="number"
                  placeholder="Amount"
                  value={newAmount}
                  min={0}
                  onChange={e => setNewAmount(e.target.value)}
                  className="border border-soft-peach rounded px-3 py-2 flex-grow"
                  disabled={adding}
                />
                <button
                  type="submit"
                  disabled={adding}
                  className="bg-deep-red hover:bg-warm-red text-white px-4 py-2 rounded"
                >
                  {adding ? 'Adding...' : 'Add'}
                </button>
              </form>
              {/* Toast notification display */}
              <ToastNotification
                message={toastMessage}
                type={toastType}
                visible={toastVisible}
                onClose={() => setToastVisible(false)}
              />
            </div>

            {/* Contribution history */}
            <div className="card max-w-3xl">
              <div className="flex items-center mb-4">
                <FaHistory className="text-warm-red mr-2" />
                <h2 className="text-xl font-semibold text-deep-red">My Contribution History</h2>
              </div>
              <div className="space-y-3">
                {contribs.contributions.length > 0 ? (
                  contribs.contributions.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 border border-soft-peach rounded-lg hover:bg-very-light-peach transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="font-medium text-deep-red">₹{c.amount}</div>
                        <div className="text-sm text-soft-peach">{new Date(c.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-soft-peach text-center py-4">No contributions yet</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
