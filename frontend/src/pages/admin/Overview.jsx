import React, { useEffect, useState } from 'react'
import api from '../../api'
import { FaRupeeSign, FaReceipt, FaWallet, FaUsers } from 'react-icons/fa'

export default function AdminOverview(){
  const [stats, setStats] = useState(null)
  const [bucketStats, setBucketStats] = useState(null)
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
  useEffect(()=>{fetchStats()}, [startDate, endDate, statusFilter, typeFilter, eventFilter, selectedBucket])

  async function fetchAll(){
    try{
      setLoading(true)
      const e = await api.get('/admin/events')
      setEvents(e.data)
      await fetchStats()
      const u = await api.get('/admin/users')
      setUsers(u.data)
    }catch(err){ console.error(err) }
    finally {
      setLoading(false)
    }
  }

  async function fetchStats(){
    try{
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (selectedBucket !== 'ALL') params.append('bucket', selectedBucket)
      if (eventFilter === 'none') {
        params.append('eventId', 'none')
      } else if (eventFilter !== 'all') {
        params.append('eventId', eventFilter)
      }

      const response = await api.get(`/stats/overview?${params.toString()}`)

      // Calculate stats based on selected bucket
      if (selectedBucket === 'ALL') {
        setStats({
          totalContributions: response.data.totalContributions,
          totalExpenses: response.data.totalExpenses,
          remaining: response.data.remaining
        })
      } else {
        // Use bucket-specific stats
        const bucketData = response.data.buckets[selectedBucket]
        setStats({
          totalContributions: bucketData.contributions,
          totalExpenses: bucketData.expenses,
          remaining: bucketData.balance
        })
      }

      setBucketStats(response.data.buckets)
    }catch(err){
      console.error(err)
      setStats({
        totalContributions: 0,
        totalExpenses: 0,
        remaining: 0
      })
      setBucketStats({
        LIFT: { contributions: 0, expenses: 0, balance: 0 },
        ALUMNI_ASSOCIATION: { contributions: 0, expenses: 0, balance: 0 }
      })
    }
  }

  const activeContributors = users.filter(u => u.active).length

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
          <p className="text-gray-600">Quick stats and financial summary</p>
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
                  { title: 'Total Contributions', value: stats?.totalContrib || 0, delta: selectedBucket !== 'ALL' ? `${selectedBucket === 'LIFT' ? 'LIFT' : 'AA'} bucket` : '', deltaColor: 'text-gray-500', iconBg: 'bg-green-50', icon: <FaRupeeSign className="text-green-600" /> },
                  { title: 'Total Expenses', value: stats?.totalExpenses || 0, delta: selectedBucket !== 'ALL' ? `${selectedBucket === 'LIFT' ? 'LIFT' : 'AA'} bucket` : '', deltaColor: 'text-gray-500', iconBg: 'bg-red-50', icon: <FaReceipt className="text-red-600" /> },
                  { title: 'Remaining Balance', value: stats?.remaining || 0, delta: selectedBucket !== 'ALL' ? `${selectedBucket === 'LIFT' ? 'LIFT' : 'AA'} bucket` : '', deltaColor: 'text-gray-500', iconBg: 'bg-blue-50', icon: <FaWallet className="text-blue-600" /> },
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
          </>
        )}
      </div>
    </div>
  )
}
