import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { FaRupeeSign, FaCreditCard, FaWallet, FaUsers, FaReceipt, FaArrowRight } from 'react-icons/fa'

export default function AdminDashboard(){
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
  const recentActivities = [...contribs.slice(0, 5).map(c => ({ ...c, type: 'contribution', icon: FaCreditCard, color: 'text-warm-red' })),
                            ...expenses.slice(0, 5).map(e => ({ ...e, type: 'expense', icon: FaReceipt, color: 'text-deep-red' }))]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)

  const fmtINR = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0)

  const quickAccessItems = [
    { to: '/admin/users', label: 'Manage Users', icon: FaUsers, color: 'bg-soft-peach text-warm-red' },
    { to: '/admin/contributions', label: 'Contributions', icon: FaCreditCard, color: 'bg-soft-peach text-warm-red' },
    { to: '/admin/expenses', label: 'Expenses', icon: FaReceipt, color: 'bg-deep-red text-warm-red' },
  ]

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 bg-transparent">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">Admin Dashboard</h1>
          <p className="text-black">Overview of alumni contributions and expenses</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-red"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {(() => {
                const items = [
                  { title: 'Total Contributions', value: report ? report.totalContrib : 0, icon: FaRupeeSign, iconBg: 'bg-soft-peach', iconColor: 'text-warm-red' },
                  { title: 'Total Expenses', value: report ? report.totalExpenses : 0, icon: FaReceipt, iconBg: 'bg-deep-red', iconColor: 'text-warm-red' },
                  { title: 'Remaining Balance', value: report ? report.remaining : 0, icon: FaWallet, iconBg: 'bg-bright-orange', iconColor: 'text-bright-orange' },
                  { title: 'Active Contributors', value: activeContributors, icon: FaUsers, iconBg: 'bg-soft-peach', iconColor: 'text-warm-red' }
                ]
                return items.map((s) => (
                  <div key={s.title} className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-bright-orange font-medium mb-2">{s.title}</div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-deep-red">
                        {s.title.includes('Active') ? s.value : fmtINR(s.value)}
                      </div>
                    </div>
                    <div className={`ml-4 p-3 rounded-lg`} style={{backgroundColor: 'rgba(246, 193, 4, 0.3)'}}>
                      <s.icon className={`text-2xl ${s.iconColor}`} />
                    </div>
                  </div>
                ))
              })()}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Quick Access</h3>
                <div className="grid grid-cols-1 gap-3">
                  {quickAccessItems.map((item) => (
                    <Link key={item.to} to={item.to} className="flex items-center justify-between p-3 bg-very-light-peach rounded-lg hover:bg-soft-peach transition-colors">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${item.color}`}>
                          <item.icon className="text-lg" />
                        </div>
                        <span className="font-medium text-deep-red">{item.label}</span>
                      </div>
                      <FaArrowRight className="text-soft-peach" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {recentActivities.map(activity => (
                    <div key={`${activity.type}-${activity.id}`} className="flex justify-between items-center p-3 border border-soft-peach rounded-lg hover:bg-soft-peach">
                      <div className="flex items-center">
                        <activity.icon className={`mr-3 ${activity.color}`} />
                        <div>
                          <div className="font-medium text-deep-red">
                            {activity.type === 'contribution' ? `${activity.user?.name} contributed` : `${activity.category} expense`}
                          </div>
                          <div className="text-sm text-black">{new Date(activity.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className={`font-semibold ${activity.type === 'contribution' ? 'text-warm-red' : 'text-deep-red'}`}>
                        ₹{activity.amount}
                      </div>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                    <p className="text-soft-peach text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
