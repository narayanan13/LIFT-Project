
import React, { useState } from 'react'
import { FaCheck, FaTimes, FaEdit, FaHistory, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import AuditLogTable from './AuditLogTable'

function StatusBadge({ status }) {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800'
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  )
}

function TypeBadge({ type }) {
  const styles = {
    BASIC: 'bg-indigo-100 text-indigo-800',
    ADDITIONAL: 'bg-teal-100 text-teal-800'
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100'}`}>
      {type}
    </span>
  )
}

export default function ContributionHistoryTable({
  contributions,
  loading = false,
  isAdmin = false,
  onApprove,
  onReject,
  onEdit,
  onViewHistory,
  auditLogs = {},
  expandedAudit = null,
  onToggleAudit,
  loadingAudit = false,
  showFilters = true,
  showUserColumn = true
}) {
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Filter contributions based on criteria
  let filteredList = [...contributions]
  if (filter !== 'all') {
    filteredList = filteredList.filter(c => c.status === filter)
  }
  if (typeFilter !== 'all') {
    filteredList = filteredList.filter(c => c.type === typeFilter)
  }
  if (startDate) {
    filteredList = filteredList.filter(c => new Date(c.date) >= new Date(startDate))
  }
  if (endDate) {
    filteredList = filteredList.filter(c => new Date(c.date) <= new Date(endDate))
  }

  const pendingCount = contributions.filter(c => c.status === 'PENDING').length

  // Sort by date descending
  filteredList.sort((a, b) => new Date(b.date) - new Date(a.date))

  const hasFilters = filter !== 'all' || typeFilter !== 'all' || startDate || endDate

  const clearFilters = () => {
    setFilter('all')
    setTypeFilter('all')
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="w-full">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-100'
                }`}
              >
                All ({contributions.length})
              </button>
              <button
                onClick={() => setFilter('PENDING')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filter === 'PENDING' ? 'bg-yellow-500 text-white' : 'bg-white border hover:bg-gray-100'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setFilter('APPROVED')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filter === 'APPROVED' ? 'bg-green-600 text-white' : 'bg-white border hover:bg-gray-100'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilter('REJECTED')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filter === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-white border hover:bg-gray-100'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1 border rounded text-sm bg-white"
            >
              <option value="all">All Types</option>
              <option value="BASIC">Basic</option>
              <option value="ADDITIONAL">Additional</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            />
          </div>

          {hasFilters && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {showUserColumn && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">User</th>
              )}
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Split</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Notes</th>
              {isAdmin && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={showUserColumn ? 8 : 7} className="px-4 py-8 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-red"></div>
                  </div>
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={showUserColumn ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                  No contributions found
                </td>
              </tr>
            ) : (
              filteredList.map((contribution) => (
                <React.Fragment key={contribution.id}>
                  <tr className="border-t hover:bg-gray-50">
                    {showUserColumn && (
                      <td className="px-4 py-3">{contribution.user?.name || 'Unknown'}</td>
                    )}
                    <td className="px-4 py-3 font-semibold text-green-600">
                      ₹{contribution.amount?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={contribution.type} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>
                            LIFT: ₹{(contribution.liftAmount || 0).toLocaleString()} ({contribution.liftPercentage || 0}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          <span>
                            AA: ₹{(contribution.aaAmount || 0).toLocaleString()} ({contribution.aaPercentage || 0}%)
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(contribution.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={contribution.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {contribution.notes || '-'}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          {contribution.status === 'PENDING' && (
                            <>
                              {onApprove && (
                                <button
                                  onClick={() => onApprove(contribution.id)}
                                  className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors"
                                  title="Approve"
                                >
                                  <FaCheck size={14} />
                                </button>
                              )}
                              {onReject && (
                                <button
                                  onClick={() => onReject(contribution.id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                                  title="Reject"
                                >
                                  <FaTimes size={14} />
                                </button>
                              )}
                            </>
                          )}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(contribution)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="Edit"
                            >
                              <FaEdit size={14} />
                            </button>
                          )}
                          {onViewHistory && (
                            <button
                              onClick={() => onToggleAudit(contribution.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-600 rounded text-sm hover:bg-purple-200 transition-colors"
                              title="View History"
                            >
                              {expandedAudit === contribution.id ? (
                                <>
                                  <FaChevronUp size={12} /> Hide
                                </>
                              ) : (
                                <>
                                  <FaHistory size={12} /> History
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                  {expandedAudit === contribution.id && (
                    <tr className="border-t border-gray-200 bg-gray-50">
                      <td colSpan={showUserColumn ? 8 : 7} className="px-4 py-4">
                        {loadingAudit && expandedAudit === contribution.id ? (
                          <div className="text-center py-4">
                            <span className="text-gray-500">Loading audit history...</span>
                          </div>
                        ) : (
                          <AuditLogTable auditLogs={auditLogs[contribution.id] || []} />
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

