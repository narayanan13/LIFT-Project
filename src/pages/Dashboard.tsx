import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import StatsCard from '../components/Dashboard/StatsCard';
import RecentActivity from '../components/Dashboard/RecentActivity';
import { DollarSign, Receipt, PiggyBank, TrendingUp, Users, Calendar, Plus, X, CheckCircle, AlertCircle, Mail } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { contributions, expenses, users, addContribution, addExpense, addInvitation, loading } = useData();
  const navigate = useNavigate();
  
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Calculate real-time budget data
  const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBalance = totalContributions - totalExpenses;
  const userContributions = contributions
    .filter(c => c.user_id === user?.id)
    .reduce((sum, c) => sum + c.amount, 0);

  const budgetData = {
    total_contributions: totalContributions,
    total_expenses: totalExpenses,
    remaining_balance: remainingBalance,
    contribution_count: contributions.length,
    expense_count: expenses.length
  };

  // Form states
  const [contributionForm, setContributionForm] = useState({
    user_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    tags: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    purpose: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    event: ''
  });

  const [inviteForm, setInviteForm] = useState({
    email: '',
    fullName: '',
    personalMessage: ''
  });

  const categories = ['Events', 'Technology', 'Education', 'Marketing', 'Administration', 'Other'];

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-contribution':
        setShowContributionModal(true);
        break;
      case 'record-expense':
        setShowExpenseModal(true);
        break;
      case 'invite-alumni':
        setShowInviteModal(true);
        break;
      case 'view-expenses':
        navigate('/expenses');
        break;
      case 'my-contributions':
        navigate('/my-contributions');
        break;
      case 'upcoming-events':
        showSuccess('Upcoming Events feature coming soon!');
        break;
      default:
        break;
    }
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await addContribution({
        user_id: contributionForm.user_id,
        amount: parseFloat(contributionForm.amount),
        date: contributionForm.date,
        notes: contributionForm.notes,
        tags: contributionForm.tags,
        created_by: user?.id || ''
      });

      if (success) {
        const selectedUser = users.find(u => u.id === contributionForm.user_id);
        showSuccess(`Contribution of $${contributionForm.amount} from ${selectedUser?.full_name} added successfully!`);
        
        setContributionForm({
          user_id: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          notes: '',
          tags: ''
        });
        setShowContributionModal(false);
      } else {
        showError('Failed to add contribution. Please try again.');
      }
    } catch (error) {
      showError('Failed to add contribution. Please try again.');
    }
    
    setIsLoading(false);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await addExpense({
        amount: parseFloat(expenseForm.amount),
        purpose: expenseForm.purpose,
        description: expenseForm.description,
        date: expenseForm.date,
        category: expenseForm.category,
        event: expenseForm.event,
        created_by: user?.id || ''
      });

      if (success) {
        showSuccess(`Expense of $${expenseForm.amount} for "${expenseForm.purpose}" recorded successfully!`);
        
        setExpenseForm({
          amount: '',
          purpose: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          category: '',
          event: ''
        });
        setShowExpenseModal(false);
      } else {
        showError('Failed to record expense. Please try again.');
      }
    } catch (error) {
      showError('Failed to record expense. Please try again.');
    }
    
    setIsLoading(false);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await addInvitation(
        {
          email: inviteForm.email,
          invited_by: user?.id || '',
          used: false,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          token: ''
        },
        {
          fullName: inviteForm.fullName,
          personalMessage: inviteForm.personalMessage
        }
      );

      if (success) {
        showSuccess(`🎉 Invitation successfully sent to ${inviteForm.email}! 
        
📧 They will receive an email with:
• A secure invitation link
• Instructions to join the platform
• Access to the alumni network

Please ask them to check their email (including spam folder) for the invitation.`);
        
        setInviteForm({
          email: '',
          fullName: '',
          personalMessage: ''
        });
        setShowInviteModal(false);
      } else {
        showError(`❌ Failed to send invitation to ${inviteForm.email}. 

Possible reasons:
• Email address is already registered
• An active invitation already exists
• Email service is temporarily unavailable

Please check the email address and try again.`);
      }
    } catch (error) {
      showError('An unexpected error occurred while sending the invitation. Please try again.');
    }
    
    setIsLoading(false);
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
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="text-emerald-700 whitespace-pre-line">{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-red-700 whitespace-pre-line">{errorMessage}</div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with the alumni fund today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Contributions"
          value={`$${budgetData.total_contributions.toLocaleString()}`}
          icon={DollarSign}
          change={{ value: '12%', type: 'increase' }}
          color="green"
        />
        <StatsCard
          title="Total Expenses"
          value={`$${budgetData.total_expenses.toLocaleString()}`}
          icon={Receipt}
          change={{ value: '8%', type: 'increase' }}
          color="red"
        />
        <StatsCard
          title="Remaining Balance"
          value={`$${budgetData.remaining_balance.toLocaleString()}`}
          icon={PiggyBank}
          change={{ value: '4%', type: 'increase' }}
          color="blue"
        />
        {!isAdmin && (
          <StatsCard
            title="My Contributions"
            value={`$${userContributions.toLocaleString()}`}
            icon={TrendingUp}
            color="purple"
          />
        )}
        {isAdmin && (
          <StatsCard
            title="Active Contributors"
            value={budgetData.contribution_count.toString()}
            icon={Users}
            color="purple"
          />
        )}
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {isAdmin ? (
                <>
                  <button 
                    onClick={() => handleQuickAction('add-contribution')}
                    className="w-full flex items-center space-x-3 p-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-all duration-200 border border-transparent hover:border-emerald-200"
                  >
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <span>Add Contribution</span>
                  </button>
                  <button 
                    onClick={() => handleQuickAction('record-expense')}
                    className="w-full flex items-center space-x-3 p-3 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 border border-transparent hover:border-red-200"
                  >
                    <Receipt className="w-5 h-5 text-red-600" />
                    <span>Record Expense</span>
                  </button>
                  <button 
                    onClick={() => handleQuickAction('invite-alumni')}
                    className="w-full flex items-center space-x-3 p-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200"
                  >
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>Invite Alumni</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => handleQuickAction('view-expenses')}
                    className="w-full flex items-center space-x-3 p-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200"
                  >
                    <Receipt className="w-5 h-5 text-blue-600" />
                    <span>View All Expenses</span>
                  </button>
                  <button 
                    onClick={() => handleQuickAction('my-contributions')}
                    className="w-full flex items-center space-x-3 p-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-all duration-200 border border-transparent hover:border-emerald-200"
                  >
                    <PiggyBank className="w-5 h-5 text-emerald-600" />
                    <span>My Contributions</span>
                  </button>
                  <button 
                    onClick={() => handleQuickAction('upcoming-events')}
                    className="w-full flex items-center space-x-3 p-3 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-all duration-200 border border-transparent hover:border-purple-200"
                  >
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span>Upcoming Events</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Budget Overview */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Funds</span>
                <span className="font-semibold text-gray-900">
                  ${budgetData.total_contributions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Spent</span>
                <span className="font-semibold text-red-600">
                  ${budgetData.total_expenses.toLocaleString()}
                </span>
              </div>
              <div className="border-t border-blue-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Available</span>
                  <span className="font-bold text-emerald-600">
                    ${budgetData.remaining_balance.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${budgetData.total_contributions > 0 ? (budgetData.remaining_balance / budgetData.total_contributions) * 100 : 0}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {budgetData.total_contributions > 0 ? Math.round((budgetData.remaining_balance / budgetData.total_contributions) * 100) : 0}% remaining
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Contribution Modal */}
      {showContributionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Contribution</h3>
              <button
                onClick={() => setShowContributionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleContributionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contributor *
                </label>
                <select
                  value={contributionForm.user_id}
                  onChange={(e) => setContributionForm(prev => ({ ...prev, user_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                >
                  <option value="">Select a contributor</option>
                  {users.filter(u => u.role === 'user').map(user => (
                    <option key={user.id} value={user.id}>{user.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={contributionForm.amount}
                  onChange={(e) => setContributionForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={contributionForm.date}
                  onChange={(e) => setContributionForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={contributionForm.notes}
                  onChange={(e) => setContributionForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={3}
                  placeholder="Optional notes about this contribution"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={contributionForm.tags}
                  onChange={(e) => setContributionForm(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="quarterly, special, event (comma-separated)"
                  disabled={isLoading}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add Contribution</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowContributionModal(false)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Record New Expense</h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose *
                </label>
                <input
                  type="text"
                  value={expenseForm.purpose}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, purpose: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                  placeholder="e.g., Annual Alumni Dinner"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event/Project
                </label>
                <input
                  type="text"
                  value={expenseForm.event}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, event: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Annual Dinner 2024"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Detailed description of the expense"
                  disabled={isLoading}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>Record Expense</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Alumni Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Mail className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Invite Alumni</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="nk13.dev@gmail.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteForm.fullName}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe (optional)"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message
                </label>
                <textarea
                  value={inviteForm.personalMessage}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, personalMessage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add a personal message to the invitation (optional)"
                  disabled={isLoading}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">📧 Real Email Will Be Sent!</p>
                    <p>A professional invitation email will be sent to the provided address with:</p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      <li>Secure invitation link</li>
                      <li>Platform access instructions</li>
                      <li>Your personal message (if provided)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  disabled={isLoading}
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

export default Dashboard;