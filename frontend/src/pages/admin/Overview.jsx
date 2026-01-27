import React, { useEffect, useState } from 'react'
import api from '../../api'
import { FaRupeeSign, FaReceipt, FaWallet, FaUsers, FaCreditCard } from 'react-icons/fa'

export default function AdminOverview(){
  const [report, setReport] = useState(null)
  const [contribs, setContribs] = useState([])
  const [expenses, setExpenses] = useState([])
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBucket, setSelectedBucket] = useState('ALL') // ALL, LIFT, ALUMNI_ASSOCIATION
  const [statusFilter, setStatusFilter] = useState('APPROVED') // all, PENDING, APPROVED, REJECTED
  const [typeFilter, setTypeFilter] = useState('all') // all, BASIC, ADDITIONAL
  const [eventFilter, setEventFilter] = useState('all') // all, none, or event ID
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(()=>{fetchAll()},[])
  useEffect(()=>{fetchData()}, [startDate, endDate, statusFilter, typeFilter, eventFilter])

  async function fetchAll(){
    try{
      setLoading(true)
      const r = await api.get('/admin/report/budget')
      setReport(r.data)
      const e = await api.get('/admin/events')
      setEvents(e.data)
      await fetchData()
      const u = await api.get('/admin/users')
      setUsers(u.data)
    }catch(err){ console.error(err) }
    finally {
      setLoading(false)
    }
  }

  async function fetchData(){
    try{
      // Build contribution params
      const contribParams = new URLSearchParams()
      if (startDate) contribParams.append('startDate', startDate)
      if (endDate) contribParams.append('endDate', endDate)
      if (statusFilter !== 'all') contribParams.append('status', statusFilter)
      if (typeFilter !== 'all') contribParams.append('type', typeFilter)

      // Build expense params
      const expenseParams = new URLSearchParams()
      if (startDate) expenseParams.append('startDate', startDate)
      if (endDate) expenseParams.append('endDate', endDate)
      if (statusFilter !== 'all') expenseParams.append('status', statusFilter)
      if (selectedBucket !== 'ALL') expenseParams.append('bucket', selectedBucket)
      if (eventFilter === 'none') {
        // Filter client-side for no event
      } else if (eventFilter !== 'all') {
        expenseParams.append('eventId', eventFilter)
      }

      const [c, e] = await Promise.all([
        api.get(`/admin/contributions?${contribParams.toString()}`),
        api.get(`/admin/expenses?${expenseParams.toString()}`)
      ])

      // Filter expenses by event client-side if needed
      let filteredExpenses = e.data
      if (eventFilter === 'none') {
        filteredExpenses = filteredExpenses.filter(exp => !exp.eventId)
      }

      setContribs(c.data)
      setExpenses(filteredExpenses)
    }catch(err){ console.error(err) }
  }

  // Filter data based on selected bucket
  const filteredContribs = selectedBucket === 'ALL'
    ? contribs
    : contribs.filter(c => c.bucket === selectedBucket)

  const filteredExpenses = selectedBucket === 'ALL'
    ? expenses
    : expenses.filter(e => e.bucket === selectedBucket)

  // Calculate stats based on bucket selection and date filters
  const getStats = () => {
    // Calculate from filtered data
    const approvedContribs = filteredContribs.filter(c => c.status === 'APPROVED')
    const approvedExpenses = filteredExpenses.filter(e => e.status === 'APPROVED')

    const totalContrib = approvedContribs.reduce((sum, c) => sum + (c.amount || 0), 0)
    const totalExpenses = approvedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const remaining = totalContrib - totalExpenses

    return { totalContrib, totalExpenses, remaining }
  }

  const stats = getStats()
  const activeContributors = users.filter(u => u.active).length

  // Calculate bucket-wise stats for summary cards
  const getBucketStats = () => {
    const approvedContribs = contribs.filter(c => c.status === 'APPROVED')
    const approvedExpenses = expenses.filter(e => e.status === 'APPROVED')

    const liftContribs = approvedContribs.filter(c => c.bucket === 'LIFT')
    const aaContribs = approvedContribs.filter(c => c.bucket === 'ALUMNI_ASSOCIATION')

    // For BASIC contributions, use liftAmount and aaAmount
    const liftTotal = liftContribs.reduce((sum, c) => sum + (c.liftAmount || c.amount || 0), 0)
    const aaTotal = aaContribs.reduce((sum, c) => sum + (c.aaAmount || c.amount || 0), 0)

    const liftExpenses = approvedExpenses.filter(e => e.bucket === 'LIFT').reduce((sum, e) => sum + (e.amount || 0), 0)
    const aaExpenses = approvedExpenses.filter(e => e.bucket === 'ALUMNI_ASSOCIATION').reduce((sum, e) => sum + (e.amount || 0), 0)

    return {
      LIFT: {
        contributions: liftTotal,
        expenses: liftExpenses,
        balance: liftTotal - liftExpenses
      },
      ALUMNI_ASSOCIATION: {
        contributions: aaTotal,
        expenses: aaExpenses,
        balance: aaTotal - aaExpenses
      }
    }
  }

  const bucketStats = getBucketStats()

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

        {/* Filters Section */}
        <div className="mb-6 space-y-4">
          {/* Bucket Filter Tabs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bucket</label>
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

          {/* Other Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="all">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Contribution Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contribution Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="all">All Types</option>
                <option value="BASIC">Basic</option>
                <option value="ADDITIONAL">Additional</option>
              </select>
            </div>

            {/* Event Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event/Group</label>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="p-2 border rounded w-full md:w-64"
              >
                <option value="all">All Events</option>
                <option value="none">No Event/Group</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-2 border rounded"
              />
            </div>

            {/* Clear All Filters Button */}
            {(startDate || endDate || statusFilter !== 'APPROVED' || typeFilter !== 'all' || eventFilter !== 'all') && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStartDate('')
                    setEndDate('')
                    setStatusFilter('APPROVED')
                    setTypeFilter('all')
                    setEventFilter('all')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            )}
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
            {selectedBucket === 'ALL' && bucketStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {Object.entries(bucketStats).map(([bucketName, data]) => {
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
