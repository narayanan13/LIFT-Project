
import React, { useEffect, useState } from 'react'
import api from '../api'
import { FaUser, FaRupeeSign, FaWallet, FaBullhorn } from 'react-icons/fa'

export default function AlumniDashboard(){
  const [announcements, setAnnouncements] = useState([])
  const [contribs, setContribs] = useState({ total:0, contributions: [] })
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ fetchAll() },[])

  async function fetchAll(){
    try{
      setLoading(true)
      const a = await api.get('/alumni/announcements')
      setAnnouncements(a.data)
      const c = await api.get('/alumni/contributions')
      setContribs(c.data)
      const s = await api.get('/alumni/budget/summary')
      setSummary(s.data)
    }catch(err){ console.error(err) }
    finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 bg-transparent">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">Alumni Dashboard</h1>
          <p className="text-gray-600">Track your contributions and stay updated</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="stat-card">
                <FaUser className="text-4xl text-blue-500 mx-auto mb-4" />
                <div className="stat-value">₹{contribs.total}</div>
                <div className="stat-label">My Contributions</div>
              </div>
              <div className="stat-card">
                <FaRupeeSign className="text-4xl text-green-500 mx-auto mb-4" />
                <div className="stat-value">₹{summary ? summary.totalContrib : '...'}</div>
                <div className="stat-label">Total Contributions</div>
              </div>
              <div className="stat-card">
                <FaWallet className="text-4xl text-purple-500 mx-auto mb-4" />
                <div className="stat-value">₹{summary ? summary.remaining : '...'}</div>
                <div className="stat-label">Remaining Balance</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            </div>

            <div className="mt-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-3">Expense Breakdown (Summary)</h3>
                {summary?.byCategory?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr>
                          <th className="py-2 text-sm text-gray-600">Category</th>
                          <th className="py-2 text-sm text-gray-600">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.byCategory.map(cat => (
                          <tr key={cat.category} className="border-t">
                            <td className="py-2">{cat.category}</td>
                            <td className="py-2">${cat._sum.amount || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No expense summary available.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
