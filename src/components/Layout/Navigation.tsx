import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  DollarSign, 
  Receipt, 
  PiggyBank, 
  Users, 
  Settings,
  BarChart3
} from 'lucide-react';

const Navigation: React.FC = () => {
  const { isAdmin } = useAuth();

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard', roles: ['admin', 'user'] },
    { to: '/expenses', icon: Receipt, label: 'Expenses', roles: ['admin', 'user'] },
    { to: '/my-contributions', icon: PiggyBank, label: 'My Contributions', roles: ['user'] },
    { to: '/admin/contributions', icon: DollarSign, label: 'Manage Contributions', roles: ['admin'] },
    { to: '/admin/expenses', icon: Receipt, label: 'Manage Expenses', roles: ['admin'] },
    { to: '/admin/users', icon: Users, label: 'Manage Users', roles: ['admin'] },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports', roles: ['admin'] },
  ];

  const userRole = isAdmin ? 'admin' : 'user';
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <nav className="bg-white border-r border-gray-200 w-64 min-h-screen">
      <div className="p-4">
        <ul className="space-y-2">
          {filteredNavItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;