import React, { useState, useEffect } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import api from '../api'
import { useNavigate, Link } from 'react-router-dom'
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const user = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (user && token) {
      const userData = JSON.parse(user)
      if (userData.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/alumni', { replace: true })
      }
    }
  }, [navigate])

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('user', JSON.stringify(res.data.user))
      localStorage.setItem('token', res.data.token)
      if (res.data.user.role === 'ADMIN') navigate('/admin')
      else navigate('/alumni')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError(null)
    setGoogleLoading(true)
    try {
      const res = await api.post('/auth/google', { credential: credentialResponse.credential })
      localStorage.setItem('user', JSON.stringify(res.data.user))
      localStorage.setItem('token', res.data.token)
      if (res.data.user.role === 'ADMIN') navigate('/admin')
      else navigate('/alumni')
    } catch (err) {
      setError(err.response?.data?.error || 'Google login failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  function handleGoogleError() {
    setError('Google sign-in failed. Please try again.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gradient mb-2">LIFT</h1>
            <p className="text-gray-600">Alumni Financial Tracking System</p>
          </div>
          <form onSubmit={submit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUser className="inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaLock className="inline mr-2" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <FaSignInAlt className="mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-In */}
          <div className="flex justify-center">
            {googleLoading ? (
              <div className="flex items-center justify-center py-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                <span className="ml-2 text-gray-600">Signing in...</span>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="300"
              />
            )}
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-deep-red hover:underline">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
