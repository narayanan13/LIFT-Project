import React, { useEffect, useState } from 'react';
import api from '../../api';
import { FaHistory, FaPlus } from 'react-icons/fa';
import ContributionHistoryTable from '../../components/ContributionHistoryTable';
import AddContributionModal from '../../components/AddContributionModal';

export default function AlumniContributions() {
  const [contribs, setContribs] = useState({ total: 0, pendingTotal: 0, liftTotal: 0, aaTotal: 0, contributions: [] });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

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
            {/* Add Contribution Button */}
            <div className="mb-8">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-6 py-3 bg-deep-red hover:bg-warm-red text-white rounded-lg font-medium transition-colors"
              >
                <FaPlus className="mr-2" />
                Add Contribution
              </button>
            </div>

            {/* Contribution history */}
            <div className="bg-white rounded-2xl shadow-sm p-6 max-w-4xl">
              <div className="flex items-center mb-4">
                <FaHistory className="text-warm-red mr-2" />
                <h2 className="text-xl font-semibold text-deep-red">Contribution History</h2>
              </div>
              <ContributionHistoryTable
                contributions={contribs.contributions}
                isAdmin={false}
                showUserColumn={false}
                showFilters={true}
              />
            </div>
          </>
        )}

        {/* Add Contribution Modal */}
        <AddContributionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchContributions}
        />
      </div>
    </div>
  );
}
