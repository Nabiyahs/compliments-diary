import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntryRouter } from '@/components/entry/entry-router'
import { isValidLocale, i18n, type Locale } from '@/lib/i18n/config'

type Props = {
  params: Promise<{ locale: string }>
}

/**
 * Root page routing logic:
 *
 * The intro/onboarding flow should ALWAYS be shown first for new sessions.
 *
 * 1. If user has valid session AND has completed onboarding → redirect to /[locale]/app
 * 2. Otherwise → show EntryRouter (client component)
 *    - EntryRouter will check localStorage for onboarding_completed
 *    - Always show intro first for new users
 *    - For returning users who completed onboarding:
 *      - If logged in → go to app
 *      - If not logged in → go to login
 */
export default async function RootPage({ params }: Props) {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : i18n.defaultLocale
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // For authenticated users, we still use EntryRouter to check onboarding status
  // since onboarding_completed is in localStorage (client-side only)
  // EntryRouter will route to /app if onboarding is completed, or /onboarding if not
  return <EntryRouter locale={locale} isAuthenticated={!!user} />
}
