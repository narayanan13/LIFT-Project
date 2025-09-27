import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Calendar, DollarSign, FileText, TrendingUp } from 'lucide-react';

const MyContributions: React.FC = () => {
  const { user } = useAuth();
  const { contributions } = useData();
  const [selectedYear, setSelectedYear] = useState('2024');

  // Filter contributions for the current user
  const userContributions = contributions.filter(c => c.user_id === user?.id);

  // Filter contributions by selected year
  const filteredContributions = userContributions.filter(contribution => 
    new Date(contribution.date).getFullYear().toString() === selectedYear
  );

  const totalContributions = userContributions.reduce((sum, contribution) => sum + contribution.amount, 0);
  const yearlyTotal = filteredContributions.reduce((sum, contribution) => sum + contribution.amount, 0);
  
  // Get available years
  const availableYears = [...new Set(userContributions.map(c => 
    new Date(c.date).getFullYear().toString()
  ))].sort().reverse();

  // If no years available, default to current year
  if (availableYears.length === 0) {
    availableYears.push(new Date().getFullYear().toString());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Contributions</h1>
        <p className="text-gray-600">
          Track your personal contributions to the alumni fund
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-700">Total Contributions</p>
              <p className="text-2xl font-bold text-emerald-900">${totalContributions.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">{selectedYear} Total</p>
              <p className="text-2xl font-bold text-blue-900">${yearlyTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-700">Avg. Contribution</p>
              <p className="text-2xl font-bold text-purple-900">
                ${userContributions.length > 0 ? Math.round(totalContributions / userContributions.length).toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Year Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Contribution History</h3>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contributions Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedYear} Contributions ({filteredContributions.length})
          </h3>
        </div>
        
        <div className="p-6">
          {filteredContributions.length > 0 ? (
            <div className="space-y-4">
              {filteredContributions.map((contribution) => (
                <div key={contribution.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        ${contribution.amount.toLocaleString()} Contribution
                      </h4>
                      <span className="text-sm text-gray-500">
                        {new Date(contribution.date).toLocaleDateString()}
                      </span>
                    </div>
                    {contribution.notes && (
                      <p className="text-sm text-gray-600 mt-1">{contribution.notes}</p>
                    )}
                    {contribution.tags && (
                      <div className="flex flex-wrap gap-2 mt-2">
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contributions for {selectedYear}</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't made any contributions in {selectedYear} yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Impact Summary */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Impact</h3>
        <p className="text-gray-700 mb-4">
          Thank you for your generous support! Your total contribution of{' '}
          <span className="font-semibold text-indigo-600">${totalContributions.toLocaleString()}</span>{' '}
          has made a significant impact on our alumni community.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p>• Supporting scholarships for deserving students</p>
            <p>• Funding community events and networking opportunities</p>
          </div>
          <div>
            <p>• Maintaining alumni platforms and resources</p>
            <p>• Contributing to institutional development</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyContributions;