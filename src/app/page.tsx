'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Camera, Star, Flame, ArrowRight } from 'lucide-react'
import { Stamp } from '@/components/day/stamp'

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsAuthenticated(true)
      }
    }
    checkAuth()
  }, [supabase])

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/app')
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Header */}
      <header className="px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">
            Praise Calendar
          </h1>
          {isAuthenticated ? (
            <Link
              href="/app"
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-medium rounded-lg hover:from-amber-500 hover:to-orange-500 transition-all"
            >
              Go to App
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-6">
                Celebrate your daily wins with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
                  Polaroid memories
                </span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                A personal praise journal where you capture moments worth celebrating.
                Add photos, stickers, and stamps to remember what you&apos;re proud of.
              </p>
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all shadow-lg hover:shadow-xl"
              >
                {isAuthenticated ? 'Open App' : 'Get Started'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>

            {/* Hero Image - Polaroid Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="relative">
                {/* Polaroid Frame */}
                <div className="bg-white rounded-sm shadow-2xl p-4 pb-16 max-w-[280px] transform rotate-3">
                  <div className="aspect-square bg-gradient-to-br from-amber-100 to-orange-100 rounded-sm flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-6xl">☀️</span>
                      <p className="text-gray-500 mt-2 text-sm">Your moment here</p>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-gray-500 font-handwriting text-sm">
                      Today was amazing!
                    </p>
                  </div>
                </div>

                {/* Floating Stamp */}
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 15 }}
                  transition={{ delay: 0.8, type: 'spring' }}
                  className="absolute -bottom-4 -right-4"
                >
                  <Stamp size="lg" />
                </motion.div>

                {/* Floating Emojis */}
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute top-4 -right-8 text-3xl"
                >
                  ✨
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="absolute -top-4 left-8 text-2xl"
                >
                  💛
                </motion.span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-12">
            Everything you need to celebrate yourself
          </h3>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: <Camera className="w-6 h-6" />,
                title: 'Polaroid Cards',
                description: 'Capture daily moments with beautiful polaroid-style photos',
              },
              {
                icon: <Star className="w-6 h-6" />,
                title: 'Emoji Stickers',
                description: 'Decorate your photos with fun, draggable emoji stickers',
              },
              {
                icon: (
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">참</span>
                  </div>
                ),
                title: '참 잘했어요 Stamps',
                description: 'Classic Korean teacher stamps to celebrate achievements',
              },
              {
                icon: <Flame className="w-6 h-6" />,
                title: 'Streak Tracking',
                description: 'Build daily habits with automatic streak counting',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Calendar Views Section */}
      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Calendar className="w-5 h-5" />,
                title: 'Month View',
                description: 'See your photo thumbnails at a glance',
              },
              {
                icon: <Calendar className="w-5 h-5" />,
                title: 'Week View',
                description: 'Monday to Sunday overview',
              },
              {
                icon: <Calendar className="w-5 h-5" />,
                title: 'Day View',
                description: 'Full details with photo editor',
              },
            ].map((view, index) => (
              <motion.div
                key={view.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 text-white flex items-center justify-center mx-auto mb-3">
                  {view.icon}
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">{view.title}</h4>
                <p className="text-sm text-gray-500">{view.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Start celebrating your wins today
          </h3>
          <p className="text-gray-600 mb-8">
            Join thousands of people who are building a habit of self-appreciation.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all shadow-lg hover:shadow-xl"
          >
            {isAuthenticated ? 'Open Your Calendar' : 'Create Free Account'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-gray-200">
        <div className="max-w-5xl mx-auto text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Praise Calendar. Made with 💛</p>
        </div>
      </footer>
    </div>
  )
}
