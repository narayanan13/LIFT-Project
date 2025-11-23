import React, { useEffect, useState } from 'react'
import api from '../../api'
import { FaRupeeSign, FaReceipt, FaWallet, FaUsers, FaCreditCard } from 'react-icons/fa'

export default function AdminOverview(){
  const [report, setReport] = useState(null)
  const [contribs, setContribs] = useState([])
  const [expenses, setExpenses] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{fetchAll()},[])

  async function fetchAll(){
    try{
      setLoading(true)
      const r = await api.get('/admin/report/budget')
      setReport(r.data)
      const c = await api.get('/admin/contributions')
      setContribs(c.data)
      const e = await api.get('/admin/expenses')
      setExpenses(e.data)
      const u = await api.get('/admin/users')
      setUsers(u.data)
    }catch(err){ console.error(err) }
    finally {
      setLoading(false)
    }
  }

  const activeContributors = users.filter(u => u.active).length
  const recentActivities = [...contribs.slice(0, 5).map(c => ({ ...c, type: 'contribution', icon: FaCreditCard, color: 'text-green-600' })),
                            ...expenses.slice(0, 5).map(e => ({ ...e, type: 'expense', icon: FaReceipt, color: 'text-red-600' }))]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">Admin Overview</h1>
          <p className="text-gray-600">Quick stats and recent activity</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {(() => {
                const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0)
                const items = [
                  { title: 'Total Contributions', value: report ? report.totalContrib : 0, delta: '+12% vs last month', deltaColor: 'text-green-500', iconBg: 'bg-green-50', icon: <FaRupeeSign className="text-green-600" /> },
                  { title: 'Total Expenses', value: report ? report.totalExpenses : 0, delta: '+8% vs last month', deltaColor: 'text-red-500', iconBg: 'bg-red-50', icon: <FaReceipt className="text-red-600" /> },
                  { title: 'Remaining Balance', value: report ? report.remaining : 0, delta: '+4% vs last month', deltaColor: 'text-blue-500', iconBg: 'bg-blue-50', icon: <FaWallet className="text-blue-600" /> },
                  { title: 'Active Contributors', value: activeContributors, delta: '', deltaColor: 'text-gray-500', iconBg: 'bg-purple-50', icon: <FaUsers className="text-purple-600" /> }
                ]
                return items.map((s) => (
                  <div key={s.title} className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500 mb-2">{s.title}</div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">{typeof s.value === 'number' ? (s.title.includes('Active') ? s.value : fmt(s.value)) : s.value}</div>
                      {s.delta && <div className={`text-sm mt-2 ${s.deltaColor}`}>{s.delta}</div>}
                    </div>
                    <div className={`ml-4 p-3 rounded-lg ${s.iconBg}`}>{s.icon}</div>
                  </div>
                ))
              })()}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivities.map(activity => (
                  <div key={`${activity.type}-${activity.id}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <activity.icon className={`mr-3 ${activity.color}`} />
                      <div>
                        <div className="font-medium text-gray-800">
                          {activity.type === 'contribution' ? `${activity.user?.name} contributed` : `${activity.category} expense`}
                        </div>
                        <div className="text-sm text-gray-500">{new Date(activity.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className={`font-semibold ${activity.type === 'contribution' ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{activity.amount}
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
