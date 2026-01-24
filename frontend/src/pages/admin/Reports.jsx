import React, { useEffect, useState } from 'react'
import api from '../../api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

export default function AdminReports(){
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/report/budget')
      .then(r => setReport(r.data))
      .catch(err => console.error('Failed to fetch report:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    )
  }

  const categoryData = (report?.byCategory || []).map(c => ({ name: c.category, value: c._sum.amount || 0 }))
  const COLORS = ['#6366F1','#EF4444','#10B981','#F59E0B','#06B6D4','#8B5CF6']

  // Bucket breakdown data
  const bucketData = report?.buckets ? [
    { name: 'LIFT', contributions: report.buckets.LIFT?.contributions || 0, expenses: report.buckets.LIFT?.expenses || 0, balance: report.buckets.LIFT?.balance || 0 },
    { name: 'Alumni Assoc.', contributions: report.buckets.ALUMNI_ASSOCIATION?.contributions || 0, expenses: report.buckets.ALUMNI_ASSOCIATION?.expenses || 0, balance: report.buckets.ALUMNI_ASSOCIATION?.balance || 0 }
  ] : []

  // Contribution type data
  const contributionTypeData = report?.byContributionType ? [
    { name: 'Basic', value: report.byContributionType.BASIC || 0 },
    { name: 'Additional', value: report.byContributionType.ADDITIONAL || 0 }
  ] : []

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Financial Reports</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Total Contributions</div>
          <div className="text-2xl font-bold text-green-600">₹{(report?.totalContrib || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
          <div className="text-2xl font-bold text-red-600">₹{(report?.totalExpenses || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-indigo-500">
          <div className="text-sm text-gray-600 mb-1">Net Balance</div>
          <div className={`text-2xl font-bold ${(report?.remaining || 0) >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
            ₹{(report?.remaining || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Bucket Balance Cards */}
      <h3 className="text-lg font-semibold mb-4">Balance by Bucket</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <div className="text-lg font-semibold">LIFT Bucket</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500">Contributions</div>
              <div className="font-semibold text-green-600">₹{(report?.buckets?.LIFT?.contributions || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Expenses</div>
              <div className="font-semibold text-red-600">₹{(report?.buckets?.LIFT?.expenses || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Balance</div>
              <div className={`font-semibold ${(report?.buckets?.LIFT?.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ₹{(report?.buckets?.LIFT?.balance || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            <div className="text-lg font-semibold">Alumni Association Bucket</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500">Contributions</div>
              <div className="font-semibold text-green-600">₹{(report?.buckets?.ALUMNI_ASSOCIATION?.contributions || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Expenses</div>
              <div className="font-semibold text-red-600">₹{(report?.buckets?.ALUMNI_ASSOCIATION?.expenses || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Balance</div>
              <div className={`font-semibold ${(report?.buckets?.ALUMNI_ASSOCIATION?.balance || 0) >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                ₹{(report?.buckets?.ALUMNI_ASSOCIATION?.balance || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Bucket Comparison Chart */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Bucket Comparison</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={bucketData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="contributions" name="Contributions" fill="#10B981" />
                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contribution Type Breakdown */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Contributions by Type</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={contributionTypeData} dataKey="value" nameKey="name" outerRadius={80} label>
                  <Cell fill="#6366F1" />
                  <Cell fill="#14B8A6" />
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expenses by Category */}
      <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {categoryData.map((d, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="value" name="Expense Amount" fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Details Table */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Category</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">Amount</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {categoryData.map((cat, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  {cat.name}
                </td>
                <td className="px-4 py-2 text-right">₹{cat.value.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">
                  {report?.totalExpenses ? ((cat.value / report.totalExpenses) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr className="border-t">
              <td className="px-4 py-2">Total</td>
              <td className="px-4 py-2 text-right">₹{(report?.totalExpenses || 0).toLocaleString()}</td>
              <td className="px-4 py-2 text-right">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
