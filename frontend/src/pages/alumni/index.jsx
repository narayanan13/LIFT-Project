import AlumniDashboard from '../AlumniDashboard'
import AlumniContributions from './AlumniContributions'
import AlumniExpenses from './AlumniExpenses'
import AlumniMeetings from './AlumniMeetings'
import AlumniActionItems from './AlumniActionItems'
import Reports from './Reports'

export const alumniLinks = [
  { to: '/alumni', label: 'Dashboard' },
  { to: '/alumni/contributions', label: 'Contributions' },
  { to: '/alumni/expenses', label: 'Expenses' },
  { to: '/alumni/meetings', label: 'Meetings' },
  { to: '/alumni/action-items', label: 'Action Items' },
  { to: '/alumni/change-password', label: 'Change Password' },
]

export default {
  AlumniDashboard, AlumniContributions, AlumniExpenses, AlumniMeetings, AlumniActionItems, Reports
}
