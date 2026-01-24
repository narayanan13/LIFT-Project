import AdminDashboard from '../AdminDashboard'
import Users from './Users'
import Contributions from './Contributions'
import Expenses from './Expenses'
import Events from './Events'
import Announcements from './Announcements'
import Meetings from './Meetings'
import Settings from './Settings'

export const adminLinks = [
  { to: '/admin/overview', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/profile', label: 'My Profile' },
  { to: '/admin/directory', label: 'Alumni Directory' },
  { to: '/admin/contributions', label: 'Contributions' },
  { to: '/admin/events', label: 'Events/Groups' },
  { to: '/admin/expenses', label: 'Expenses' },
  { to: '/admin/meetings', label: 'Meetings' },
  { to: '/admin/settings', label: 'Settings' },
  { to: '/admin/change-password', label: 'Change Password' },
]

export default {
  AdminDashboard, Users, Contributions, Expenses, Events, Announcements, Meetings, Settings
}
