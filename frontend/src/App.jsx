import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import AlumniDashboard from './pages/AlumniDashboard'
import LandingPage from './pages/LandingPage'
import DashboardLayout from './components/DashboardLayout'
import { adminLinks } from './pages/admin'
import AdminOverview from './pages/admin/Overview'
import AdminUsers from './pages/admin/Users'
import AdminContributions from './pages/admin/Contributions'
import AdminExpenses from './pages/admin/Expenses'
import AdminEvents from './pages/admin/Events'
import AdminAnnouncements from './pages/admin/Announcements'
import AdminReports from './pages/admin/Reports'
import AdminMeetings from './pages/admin/Meetings'
import AlumniReports from './pages/alumni/Reports'
import AlumniContributions from './pages/alumni/AlumniContributions'
import AlumniExpenses from './pages/alumni/AlumniExpenses'
import AlumniMeetings from './pages/alumni/AlumniMeetings'
import AlumniActionItems from './pages/alumni/AlumniActionItems'
import AlumniProfile from './pages/alumni/AlumniProfile'
import AlumniDirectory from './pages/alumni/AlumniDirectory'
import ChangePassword from './pages/ChangePassword'

function useAuth() {
  const user = localStorage.getItem('user');
  return { user: user ? JSON.parse(user) : null };
}

function Protected({ children, role }) {
  const auth = useAuth();
  if (!auth.user) return <Navigate to="/login" replace />;
  if (role && auth.user?.role !== role) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Protected role={'ADMIN'}><DashboardLayout links={adminLinks} /></Protected>} >
          <Route index element={<AdminDashboard />} />
          <Route path="overview" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="contributions" element={<AdminContributions />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="expenses" element={<AdminExpenses />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="meetings" element={<AdminMeetings />} />
          <Route path="profile" element={<AlumniProfile />} />
          <Route path="directory" element={<AlumniDirectory />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
        <Route path="/alumni" element={<Protected role={'ALUMNI'}><DashboardLayout role={'ALUMNI'} /></Protected>} >
          <Route index element={<AlumniDashboard/>} />
          <Route path="profile" element={<AlumniProfile />} />
          <Route path="directory" element={<AlumniDirectory />} />
          <Route path="contributions" element={<AlumniContributions />} />
          <Route path="expenses" element={<AlumniExpenses />} />
          <Route path="meetings" element={<AlumniMeetings />} />
          <Route path="action-items" element={<AlumniActionItems />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
    </Routes>
  )
}
