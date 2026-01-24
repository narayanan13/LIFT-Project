import React from 'react'

export default function AuditLogTable({ auditLogs }) {
  if (!auditLogs || auditLogs.length === 0) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded">
        <p className="text-gray-500 text-sm">No audit history available</p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Audit History</h4>
      <div className="bg-gray-50 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Action</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">User</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Timestamp</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Notes</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id} className="border-t border-gray-200">
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    log.action === 'APPROVED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-900">{log.user.name}</td>
                <td className="px-3 py-2 text-gray-600">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-gray-600">{log.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}