import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: {
    value: string;
    type: 'increase' | 'decrease';
  };
  color: 'blue' | 'green' | 'purple' | 'red' | 'orange';
}

const colorClasses = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    icon: 'bg-blue-500/20 text-blue-600',
    change: 'text-blue-600'
  },
  green: {
    bg: 'from-emerald-500 to-emerald-600',
    icon: 'bg-emerald-500/20 text-emerald-600',
    change: 'text-emerald-600'
  },
  purple: {
    bg: 'from-purple-500 to-purple-600',
    icon: 'bg-purple-500/20 text-purple-600',
    change: 'text-purple-600'
  },
  red: {
    bg: 'from-red-500 to-red-600',
    icon: 'bg-red-500/20 text-red-600',
    change: 'text-red-600'
  },
  orange: {
    bg: 'from-orange-500 to-orange-600',
    icon: 'bg-orange-500/20 text-orange-600',
    change: 'text-orange-600'
  }
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, change, color }) => {
  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${colors.change}`}>
                {change.type === 'increase' ? '+' : '-'}{change.value}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors.icon}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;