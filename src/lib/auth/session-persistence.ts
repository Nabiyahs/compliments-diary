'use client'

/**
 * Session persistence utilities for "Keep me logged in" feature.
 *
 * Strategy:
 * - Store the user's "remember me" preference in localStorage
 * - Use sessionStorage to track browser session identity
 * - On page load, if "remember me" is false and we detect a new browser session,
 *   we should sign out the user
 *
 * This works with Supabase's cookie-based auth without breaking SSR.
 */

const REMEMBER_ME_KEY = 'remember_me'
const SESSION_ID_KEY = 'browser_session_id'

/**
 * Get the "remember me" preference
 */
export function getRememberMe(): boolean {
  if (typeof window === 'undefined') return true
  const value = localStorage.getItem(REMEMBER_ME_KEY)
  // Default to true if not set (better UX)
  return value === null ? true : value === 'true'
}

/**
 * Set the "remember me" preference
 */
export function setRememberMe(value: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(REMEMBER_ME_KEY, String(value))

  if (value) {
    // If remembering, store session ID in localStorage too
    const sessionId = getOrCreateSessionId()
    localStorage.setItem(SESSION_ID_KEY, sessionId)
  } else {
    // If not remembering, remove from localStorage
    localStorage.removeItem(SESSION_ID_KEY)
  }
}

/**
 * Get or create a unique session ID for this browser session.
 * This is stored in sessionStorage, so it's unique per tab/session.
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = sessionStorage.getItem(SESSION_ID_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem(SESSION_ID_KEY, sessionId)
  }
  return sessionId
}

/**
 * Check if this is a new browser session (user closed and reopened browser).
 * Returns true if the user should be signed out due to "remember me" being off.
 */
export function shouldSignOutOnNewSession(): boolean {
  if (typeof window === 'undefined') return false

  const rememberMe = getRememberMe()

  // If remember me is on, never sign out
  if (rememberMe) return false

  // Check if this is a new browser session
  const currentSessionId = getOrCreateSessionId()
  const storedSessionId = localStorage.getItem(SESSION_ID_KEY)

  // If no stored session ID, this is the first session - don't sign out
  if (!storedSessionId) {
    localStorage.setItem(SESSION_ID_KEY, currentSessionId)
    return false
  }

  // If session IDs don't match, this is a new session
  if (currentSessionId !== storedSessionId) {
    // Update stored session ID
    localStorage.setItem(SESSION_ID_KEY, currentSessionId)
    return true
  }

  return false
}

/**
 * Clear session tracking (call on logout)
 */
export function clearSessionTracking(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_ID_KEY)
  sessionStorage.removeItem(SESSION_ID_KEY)
}
