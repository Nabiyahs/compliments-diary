import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientProviders } from '@/components/providers/client-providers'
import { AppShell } from '@/components/shell'
import { WelcomeScreenHider } from '@/components/welcome-screen-hider'

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: {
    default: 'DayPat',
    template: '%s | DayPat',
  },
  description: 'Your daily praise journal with polaroid memories',
  keywords: ['praise', 'journal', 'diary', 'polaroid', 'self-care', 'gratitude', 'streak'],
  authors: [{ name: 'DayPat' }],
  // PWA manifest
  manifest: '/manifest.json',
  // iOS PWA settings (Add to Home Screen)
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DayPat',
  },
  openGraph: {
    title: 'DayPat',
    description: 'Your daily praise journal with polaroid memories',
    type: 'website',
  },
  // App icons
  icons: {
    icon: [
      { url: '/icons/daypat-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/daypat-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

// Inline styles for Welcome Screen - must match login page exactly
// This is rendered server-side so it appears immediately before JS loads
const welcomeScreenStyles = `
  #welcome-screen {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(to bottom right, #fffbeb, #fefce8, #fff7ed);
    transition: opacity 400ms ease-out, visibility 0ms linear 400ms;
  }
  #welcome-screen.hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
  #welcome-screen .welcome-content {
    text-align: center;
  }
  #welcome-screen .welcome-title {
    font-family: 'Caveat', cursive;
    font-size: 3rem;
    font-weight: 700;
    color: #F27430;
    margin-bottom: 0.75rem;
    line-height: 1;
  }
  #welcome-screen .welcome-subtitle {
    font-family: 'Noto Sans', 'Inter', sans-serif;
    font-size: 0.875rem;
    color: #F27430;
    letter-spacing: 0.025em;
  }
`

// Inline script to provide hide function and auto-hide fallback
const welcomeScreenScript = `
  window.__hideWelcomeScreen = function() {
    var el = document.getElementById('welcome-screen');
    if (el && !el.classList.contains('hidden')) {
      el.classList.add('hidden');
      // Remove from DOM after transition completes
      setTimeout(function() {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 450);
    }
  };
  // Fallback: auto-hide after 5 seconds if app doesn't call hide
  setTimeout(function() { window.__hideWelcomeScreen(); }, 5000);
  // Also hide on window load as additional safety
  window.addEventListener('load', function() {
    setTimeout(function() { window.__hideWelcomeScreen(); }, 100);
  });
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Inter:wght@300;400;500;600;700&family=Noto+Sans:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Inline styles for welcome screen - ensures immediate display */}
        <style dangerouslySetInnerHTML={{ __html: welcomeScreenStyles }} />
      </head>
      <body className="antialiased font-sans" style={{ fontFamily: "'Noto Sans', 'Inter', sans-serif" }}>
        {/* Welcome Screen - rendered server-side, visible immediately */}
        <div id="welcome-screen">
          <div className="welcome-content">
            <h1 className="welcome-title">DayPat</h1>
            <p className="welcome-subtitle">EVERYDAY DESERVES A PAT.</p>
          </div>
        </div>
        {/* Inline script for hide function - runs before React hydration */}
        <script dangerouslySetInnerHTML={{ __html: welcomeScreenScript }} />

        <ClientProviders>
          <AppShell>{children}</AppShell>
        </ClientProviders>

        {/* Client component to hide welcome screen after hydration */}
        <WelcomeScreenHider />
      </body>
    </html>
  );
}
