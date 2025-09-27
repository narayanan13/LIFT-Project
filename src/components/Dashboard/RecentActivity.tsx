import React from 'react';
import { Calendar, DollarSign, Receipt, User } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const RecentActivity: React.FC = () => {
  const { contributions, expenses } = useData();

  // Combine contributions and expenses into a single activity feed
  const activities = [
    ...contributions.slice(0, 3).map(contribution => ({
      id: contribution.id,
      type: 'contribution' as const,
      description: contribution.notes || 'Contribution',
      amount: contribution.amount,
      date: contribution.date,
      user: contribution.user?.full_name
    })),
    ...expenses.slice(0, 3).map(expense => ({
      id: expense.id,
      type: 'expense' as const,
      description: expense.purpose,
      amount: expense.amount,
      date: expense.date,
      user: expense.created_by_user?.full_name
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>
      <div className="p-6">
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`p-2 rounded-lg ${
                  item.type === 'contribution' 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {item.type === 'contribution' ? (
                    <DollarSign className="w-4 h-4" />
                  ) : (
                    <Receipt className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.description}</p>
                  {item.user && (
                    <div className="flex items-center space-x-1 mt-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500">{item.user}</p>
                    </div>
                  )}
                  <div className="flex items-center space-x-1 mt-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    item.type === 'contribution' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {item.type === 'contribution' ? '+' : '-'}${item.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <Receipt className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;