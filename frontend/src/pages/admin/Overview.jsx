import React, { useEffect, useState } from 'react'
import api from '../../api'
import { FaRupeeSign, FaReceipt, FaWallet, FaUsers, FaCreditCard } from 'react-icons/fa'

export default function AdminOverview(){
  const [report, setReport] = useState(null)
  const [contribs, setContribs] = useState([])
  const [expenses, setExpenses] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBucket, setSelectedBucket] = useState('ALL') // ALL, LIFT, ALUMNI_ASSOCIATION

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

  // Filter data based on selected bucket
  const filteredContribs = selectedBucket === 'ALL'
    ? contribs
    : contribs.filter(c => c.bucket === selectedBucket)

  const filteredExpenses = selectedBucket === 'ALL'
    ? expenses
    : expenses.filter(e => e.bucket === selectedBucket)

  // Calculate stats based on bucket selection
  const getStats = () => {
    if (!report) return { totalContrib: 0, totalExpenses: 0, remaining: 0 }

    if (selectedBucket === 'ALL') {
      return {
        totalContrib: report.totalContrib,
        totalExpenses: report.totalExpenses,
        remaining: report.remaining
      }
    }

    const bucketData = report.buckets?.[selectedBucket]
    if (bucketData) {
      return {
        totalContrib: bucketData.contributions,
        totalExpenses: bucketData.expenses,
        remaining: bucketData.balance
      }
    }

    return { totalContrib: 0, totalExpenses: 0, remaining: 0 }
  }

  const stats = getStats()
  const activeContributors = users.filter(u => u.active).length

  const recentActivities = [
    ...filteredContribs.slice(0, 5).map(c => ({ ...c, type: 'contribution', icon: FaCreditCard, color: 'text-green-600' })),
    ...filteredExpenses.slice(0, 5).map(e => ({ ...e, type: 'expense', icon: FaReceipt, color: 'text-red-600' }))
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)

  const bucketTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'LIFT', label: 'LIFT' },
    { id: 'ALUMNI_ASSOCIATION', label: 'Alumni Association' }
  ]

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">Admin Overview</h1>
          <p className="text-gray-600">Quick stats and recent activity</p>
        </div>

        {/* Bucket Filter Tabs */}
        <div className="mb-6">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            {bucketTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedBucket(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedBucket === tab.id
                    ? 'bg-deep-red text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
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
                  { title: 'Total Contributions', value: stats.totalContrib, delta: selectedBucket !== 'ALL' ? `${selectedBucket === 'LIFT' ? 'LIFT' : 'AA'} bucket` : '', deltaColor: 'text-gray-500', iconBg: 'bg-green-50', icon: <FaRupeeSign className="text-green-600" /> },
                  { title: 'Total Expenses', value: stats.totalExpenses, delta: selectedBucket !== 'ALL' ? `${selectedBucket === 'LIFT' ? 'LIFT' : 'AA'} bucket` : '', deltaColor: 'text-gray-500', iconBg: 'bg-red-50', icon: <FaReceipt className="text-red-600" /> },
                  { title: 'Remaining Balance', value: stats.remaining, delta: selectedBucket !== 'ALL' ? `${selectedBucket === 'LIFT' ? 'LIFT' : 'AA'} bucket` : '', deltaColor: 'text-gray-500', iconBg: 'bg-blue-50', icon: <FaWallet className="text-blue-600" /> },
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

            {/* Bucket Summary Cards (shown when ALL is selected) */}
            {selectedBucket === 'ALL' && report?.buckets && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {Object.entries(report.buckets).map(([bucketName, data]) => {
                  const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0)
                  const displayName = bucketName === 'LIFT' ? 'LIFT' : 'Alumni Association'
                  const bgColor = bucketName === 'LIFT' ? 'bg-gradient-to-r from-blue-50 to-blue-100' : 'bg-gradient-to-r from-purple-50 to-purple-100'
                  const borderColor = bucketName === 'LIFT' ? 'border-l-blue-500' : 'border-l-purple-500'

                  return (
                    <div key={bucketName} className={`${bgColor} rounded-2xl shadow-sm p-6 border-l-4 ${borderColor}`}>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">{displayName}</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Contributions</div>
                          <div className="text-lg font-bold text-green-600">{fmt(data.contributions)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Expenses</div>
                          <div className="text-lg font-bold text-red-600">{fmt(data.expenses)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Balance</div>
                          <div className={`text-lg font-bold ${data.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(data.balance)}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                {selectedBucket !== 'ALL' && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {selectedBucket === 'LIFT' ? 'LIFT' : 'Alumni Association'}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {recentActivities.map(activity => (
                  <div key={`${activity.type}-${activity.id}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <activity.icon className={`mr-3 ${activity.color}`} />
                      <div>
                        <div className="font-medium text-gray-800">
                          {activity.type === 'contribution' ? `${activity.user?.name} contributed` : `${activity.category} expense`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(activity.date).toLocaleDateString()}
                          {activity.bucket && (
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                              activity.bucket === 'LIFT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {activity.bucket === 'LIFT' ? 'LIFT' : 'AA'}
                            </span>
                          )}
                        </div>
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
