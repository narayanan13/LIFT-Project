import React, { useEffect, useState } from 'react'
import api from '../../api'
import { FaEdit, FaBan, FaPlus } from 'react-icons/fa'

export default function AdminUsers(){
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ALUMNI' })
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' })

  async function fetch(){
    const res = await api.get('/admin/users')
    setUsers(res.data)
  }

  useEffect(()=>{ fetch() },[])

  async function toggle(u){
    await api.put(`/admin/users/${u.id}`, { active: !u.active })
    fetch()
  }

  function openEditModal(u){
    setEditUser(u)
    setEditForm({ name: u.name, email: u.email, role: u.role })
  }

  async function updateUser(e){
    e.preventDefault()
    try {
      await api.put(`/admin/users/${editUser.id}`, editForm)
      setEditUser(null)
      fetch()
    } catch (err) {
      alert('Failed to update user: ' + err.response?.data?.error || err.message)
    }
  }

  async function addUser(e){
    e.preventDefault()
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!token || !user || user.role !== 'ADMIN') {
      alert('You must be logged in as an admin to add users.')
      return
    }
    try {
      await api.post('/admin/users', form)
      setForm({ name: '', email: '', password: '', role: 'ALUMNI' })
      setShowModal(false)
      fetch()
    } catch (err) {
      alert('Failed to add user: ' + err.response?.data?.error || err.message)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Users</h2>
        <button onClick={()=>setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
          <FaPlus className="mr-2" /> Add New User
        </button>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New User</h3>
            <form onSubmit={addUser}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e)=>setForm({...form, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e)=>setForm({...form, email: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e)=>setForm({...form, password: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
                <select
                  value={form.role}
                  onChange={(e)=>setForm({...form, role: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="ALUMNI">Alumni</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <form onSubmit={updateUser}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={editForm.name}
                  onChange={(e)=>setEditForm({...editForm, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={editForm.email}
                  onChange={(e)=>setEditForm({...editForm, email: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
                <select
                  value={editForm.role}
                  onChange={(e)=>setEditForm({...editForm, role: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="ALUMNI">Alumni</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={()=>setEditUser(null)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Update User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-sm rounded">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Name</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Email</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Role</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u=> (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2">{u.active ? 'Active' : 'Inactive'}</td>
                <td className="px-4 py-2 space-x-2">
                  <button onClick={()=>openEditModal(u)} className="text-blue-600 hover:text-blue-800"><FaEdit /></button>
                  <button onClick={()=>toggle(u)} className="text-red-600 hover:text-red-800"><FaBan /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
