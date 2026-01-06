'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient, setRememberMe, getRememberMe, resetSupabaseClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Loader2, AlertCircle, CheckCircle, Bug } from 'lucide-react'
import { motion } from 'framer-motion'

// Get package version for diagnostics
const SUPABASE_JS_VERSION = '2.89.0' // From package.json

interface AuthDebugInfo {
  supabaseUrl: string | undefined
  hasAnonKey: boolean
  provider: string
  redirectTo: string
  error: string | null
  timestamp: string
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMeState] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for error params from OAuth callback
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const errorDesc = searchParams.get('error_description')

    if (errorParam) {
      let errorMessage = errorDesc || `Authentication error: ${errorParam}`

      // Provide more helpful messages for common errors
      if (errorParam === 'access_denied') {
        errorMessage = 'Access was denied. Please try again or use a different login method.'
      } else if (errorParam === 'unsupported_provider' || errorDesc?.includes('unsupported')) {
        errorMessage = 'Kakao login is not enabled. Please check the Supabase dashboard configuration.'
      }

      setError(errorMessage)
    }

    // Initialize remember me state
    setRememberMeState(getRememberMe())
  }, [searchParams])

  // Update remember me preference before sign in
  const handleRememberMeChange = (checked: boolean) => {
    setRememberMeState(checked)
    setRememberMe(checked)
    resetSupabaseClient() // Reset client to use new storage
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    // Ensure Remember Me is set before creating client
    setRememberMe(rememberMe)
    resetSupabaseClient()
    const supabase = createClient()

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        setMessage('Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        // Use replace instead of push to prevent back button issues
        router.replace('/app')
        router.refresh()
      }
    } catch (err) {
      console.error('[Login] Error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleKakaoAuth = async () => {
    setLoading(true)
    setError(null)

    // Ensure Remember Me is set before creating client
    setRememberMe(rememberMe)
    resetSupabaseClient()
    const supabase = createClient()

    const redirectTo = `${window.location.origin}/auth/callback?next=/app`

    // Log diagnostic info
    const diagnosticInfo: AuthDebugInfo = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      provider: 'kakao',
      redirectTo,
      error: null,
      timestamp: new Date().toISOString(),
    }

    console.log('[Kakao Auth] Starting OAuth flow:', {
      supabaseJsVersion: SUPABASE_JS_VERSION,
      ...diagnosticInfo,
    })

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo,
          skipBrowserRedirect: false,
        },
      })

      console.log('[Kakao Auth] Response:', { data, error })

      if (error) {
        diagnosticInfo.error = error.message
        setDebugInfo(diagnosticInfo)

        // Check for specific error types
        if (error.message.includes('unsupported') || error.message.includes('provider')) {
          throw new Error(
            'Kakao provider is not enabled in your Supabase project. ' +
            'Please enable it in the Supabase Dashboard under Authentication > Providers > Kakao.'
          )
        }
        throw error
      }

      // OAuth should redirect, but if data.url exists, redirect manually
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('[Login] Kakao OAuth error:', err)
      diagnosticInfo.error = err instanceof Error ? err.message : 'Unknown error'
      setDebugInfo(diagnosticInfo)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Praise Journal
            </h1>
            <p className="text-gray-500 text-sm">
              Your daily praise journal with polaroid memories
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-red-600 text-sm">{error}</span>
            </motion.div>
          )}

          {/* Success Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2"
            >
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-green-600 text-sm">{message}</span>
            </motion.div>
          )}

          {/* Kakao OAuth Button */}
          <button
            onClick={handleKakaoAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#FDD835] disabled:opacity-50 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors mb-6"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.86 5.33 4.64 6.74-.16.57-.58 2.07-.67 2.39-.1.4.15.39.31.29.13-.08 2.02-1.37 2.84-1.93.63.09 1.27.13 1.88.13 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8z" />
            </svg>
            {loading ? 'Connecting...' : 'Continue with Kakao'}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all disabled:bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => handleRememberMeChange(e.target.checked)}
                disabled={loading}
                className="h-4 w-4 text-pink-500 focus:ring-pink-400 border-gray-300 rounded cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-600 cursor-pointer"
              >
                Keep me logged in
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <p className="text-center text-gray-500 text-sm mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setMessage(null)
              }}
              disabled={loading}
              className="text-pink-600 hover:text-pink-700 font-medium disabled:opacity-50"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          {/* Debug Panel (Development only) */}
          {isDev && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600"
              >
                <Bug className="w-4 h-4" />
                {showDebug ? 'Hide' : 'Show'} Debug Info
              </button>

              {showDebug && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs font-mono space-y-1">
                  <p><span className="text-gray-500">Supabase JS:</span> v{SUPABASE_JS_VERSION}</p>
                  <p><span className="text-gray-500">URL:</span> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}</p>
                  <p><span className="text-gray-500">Key:</span> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***SET***' : 'NOT SET'}</p>
                  <p><span className="text-gray-500">Origin:</span> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
                  {debugInfo && (
                    <>
                      <hr className="border-gray-200 my-2" />
                      <p className="text-gray-500">Last Auth Attempt:</p>
                      <p><span className="text-gray-500">Provider:</span> {debugInfo.provider}</p>
                      <p><span className="text-gray-500">Redirect:</span> {debugInfo.redirectTo}</p>
                      {debugInfo.error && (
                        <p className="text-red-500"><span className="text-gray-500">Error:</span> {debugInfo.error}</p>
                      )}
                      <p><span className="text-gray-500">Time:</span> {debugInfo.timestamp}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
