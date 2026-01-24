import React, { useEffect, useState } from 'react'
import api from '../../api'

export default function Settings() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [splitValue, setSplitValue] = useState(50)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings')
      setSettings(response.data)
      const splitSetting = response.data.find(s => s.key === 'basic_contribution_split_lift')
      if (splitSetting) {
        setSplitValue(parseFloat(splitSetting.value))
      }
    } catch (err) {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSplit = async () => {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      await api.put('/admin/settings/basic_contribution_split_lift', {
        value: String(splitValue),
        description: 'Percentage of BASIC contributions allocated to LIFT bucket (0-100). Remainder goes to Alumni Association.'
      })
      setSuccess('Split percentage updated successfully')
      fetchSettings()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update setting')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Contribution Split</h3>
        <p className="text-gray-600 mb-4">
          Configure how BASIC contributions are split between the LIFT bucket and the Alumni Association bucket.
          This setting only affects new contributions.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            LIFT Bucket Percentage: {splitValue}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={splitValue}
            onChange={(e) => setSplitValue(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">LIFT Bucket</div>
            <div className="text-2xl font-bold text-blue-700">{splitValue}%</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-sm text-purple-600 font-medium">Alumni Association</div>
            <div className="text-2xl font-bold text-purple-700">{100 - splitValue}%</div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg mb-6">
          <div className="text-sm font-medium text-gray-700 mb-2">Example Calculation</div>
          <div className="text-sm text-gray-600">
            For a BASIC contribution of <span className="font-semibold">$1,000</span>:
            <ul className="list-disc list-inside mt-2">
              <li>LIFT Bucket: <span className="font-semibold text-blue-600">${(1000 * splitValue / 100).toFixed(2)}</span></li>
              <li>Alumni Association: <span className="font-semibold text-purple-600">${(1000 * (100 - splitValue) / 100).toFixed(2)}</span></li>
            </ul>
          </div>
        </div>

        <button
          onClick={handleSaveSplit}
          disabled={saving}
          className={`px-4 py-2 rounded text-white ${
            saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">About Buckets</h3>
        <div className="space-y-4 text-gray-600">
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 mt-1 bg-blue-500 rounded-full flex-shrink-0"></div>
            <div>
              <div className="font-medium text-gray-800">LIFT Bucket</div>
              <div className="text-sm">Funds allocated to LIFT organization operations and initiatives.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 mt-1 bg-purple-500 rounded-full flex-shrink-0"></div>
            <div>
              <div className="font-medium text-gray-800">Alumni Association Bucket</div>
              <div className="text-sm">Funds allocated to Alumni Association activities and programs.</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="font-medium text-yellow-800">Important Notes</div>
          <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
            <li>BASIC contributions are automatically split according to this percentage.</li>
            <li>ADDITIONAL contributions must specify which bucket they go to.</li>
            <li>Expenses must also be assigned to a specific bucket.</li>
            <li>Changes to the split percentage only affect new contributions.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
