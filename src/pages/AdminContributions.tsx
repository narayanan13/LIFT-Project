import React, { useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, DollarSign, User, Calendar } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

const AdminContributions: React.FC = () => {
  const { contributions, users, addContribution, updateContribution, deleteContribution, loading } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContribution, setEditingContribution] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    user_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    tags: ''
  });

  const filteredContributions = contributions.filter(contribution => {
    const matchesSearch = contribution.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contribution.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contribution.tags?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = selectedUser === '' || contribution.user_id === selectedUser;
    return matchesSearch && matchesUser;
  });

  const totalContributions = filteredContributions.reduce((sum, contribution) => sum + contribution.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const contributionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        created_by: user?.id || ''
      };

      let success = false;
      if (editingContribution) {
        success = await updateContribution(editingContribution.id, contributionData);
      } else {
        success = await addContribution(contributionData);
      }

      if (success) {
        resetForm();
      } else {
        alert('Failed to save contribution. Please try again.');
      }
    } catch (error) {
      console.error('Error saving contribution:', error);
      alert('An error occurred while saving the contribution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (contribution: any) => {
    setEditingContribution(contribution);
    setFormData({
      user_id: contribution.user_id,
      amount: contribution.amount.toString(),
      date: contribution.date,
      notes: contribution.notes || '',
      tags: contribution.tags || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this contribution?')) {
      const success = await deleteContribution(id);
      if (!success) {
        alert('Failed to delete contribution. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      tags: ''
    });
    setEditingContribution(null);
    setShowAddModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Contributions</h1>
          <p className="text-gray-600">Add, edit, and track all alumni contributions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>Add Contribution</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contributions</p>
              <p className="text-2xl font-bold text-gray-900">${totalContributions.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Contributors</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(filteredContributions.map(c => c.user_id)).size}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                ${contributions.filter(c => new Date(c.date).getMonth() === new Date().getMonth())
                  .reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contributions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Contributors</option>
              {users.filter(u => u.role === 'user').map(user => (
                <option key={user.id} value={user.id}>{user.full_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contributions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contributor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Notes</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tags</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContributions.map((contribution) => (
                <tr key={contribution.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-emerald-600 text-sm font-semibold">
                          {contribution.user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{contribution.user?.full_name || 'Unknown User'}</p>
                        <p className="text-sm text-gray-500">{contribution.user?.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-emerald-600">
                      ${contribution.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(contribution.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 max-w-xs truncate">
                      {contribution.notes || 'No notes'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {contribution.tags && (
                      <div className="flex flex-wrap gap-1">
                        {contribution.tags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(contribution)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contribution.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingContribution ? 'Edit Contribution' : 'Add New Contribution'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contributor
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Select a contributor</option>
                  {users.filter(u => u.role === 'user').map(user => (
                    <option key={user.id} value={user.id}>{user.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={3}
                  placeholder="Optional notes about this contribution"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="quarterly, special, event (comma-separated)"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : editingContribution ? 'Update' : 'Add'} Contribution
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContributions;