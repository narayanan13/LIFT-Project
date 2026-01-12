import AdminDashboard from '../AdminDashboard'
import Users from './Users'
import Contributions from './Contributions'
import Expenses from './Expenses'
import Events from './Events'
import Announcements from './Announcements'

export const adminLinks = [
  { to: '/admin/overview', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/contributions', label: 'Contributions' },
  { to: '/admin/events', label: 'Events/Groups' },
  { to: '/admin/expenses', label: 'Expenses' },
]

export default {
  AdminDashboard, Users, Contributions, Expenses, Events, Announcements
}
