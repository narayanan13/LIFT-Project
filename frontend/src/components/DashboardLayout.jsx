import React from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

function Sidebar({ links }){
  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4">
      <div className="text-xl font-bold text-indigo-600 mb-6">LIFT Alumni Hub</div>
      <nav className="space-y-2">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end
            className={({isActive}) =>
              `block px-3 py-2 rounded ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default function DashboardLayout({ links, role, children }){
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))


  const adminLinks = [
    { to: '/admin/overview', label: 'Overview' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/directory', label: 'Alumni Directory' },
    { to: '/admin/contributions', label: 'Contributions' },
    { to: '/admin/events', label: 'Events/Groups' },
    { to: '/admin/expenses', label: 'Expenses' },
    { to: '/admin/meetings', label: 'Meetings' },
    { to: '/admin/change-password', label: 'Change Password' },
  ]
  const alumniLinks = [
    { to: '/alumni', label: 'Home' },
    { to: '/alumni/profile', label: 'My Profile' },
    { to: '/alumni/directory', label: 'Alumni Directory' },
    { to: '/alumni/contributions', label: 'Contributions' },
    { to: '/alumni/expenses', label: 'Expenses' },
    { to: '/alumni/meetings', label: 'Meetings' },
    { to: '/alumni/action-items', label: 'Action Items' },
    { to: '/alumni/change-password', label: 'Change Password' },
  ]
  const nav = links ?? (role === 'ADMIN' ? adminLinks : alumniLinks)

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="font-bold text-xl text-deep-red">LIFT Alumni Hub</div>
          <div className="flex items-center space-x-4">
            <span className="text-bright-orange font-bold">Welcome, {user?.name || user?.email}</span>
            <button onClick={handleLogout} className="bg-deep-red text-white px-4 py-2 rounded hover:bg-warm-red">Logout</button>
          </div>
        </header>
        <div className="flex flex-1">
          <aside className="w-64 border-r" style={{backgroundColor: 'rgba(244, 202, 147, 1)'}}>
            {/* <div className="p-4 font-bold text-xl">LIFT</div> */}
            <nav className="p-4">
              <ul className="space-y-2">
{nav?.map(l => (
  <li key={l.to}>
    <NavLink 
      to={l.to} 
      end
      className={({isActive}) =>
        `block py-2 px-3 rounded ${isActive ? 'bg-deep-red text-white' : 'text-warm-red hover:bg-very-light-peach'}`
      }
    >
      {l.label}
    </NavLink>
  </li>
))}
              </ul>
            </nav>
            <div className="p-4 border-t mt-auto">
              <Link to="/" className="block py-2 px-3 rounded text-md text-deep-red hover:underline hover:bg-white ">Back to site</Link>
            </div>
          </aside>
          <main className="flex-1 p-6 bg-gray-100">
            {children ? children : <Outlet />}
          </main>
        </div>
      </div>
  )
}
