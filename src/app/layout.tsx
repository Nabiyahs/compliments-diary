import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Praise Journal",
  description: "A personal daily praise journal with polaroid memories, stickers, and classic Korean teacher stamps",
  keywords: ["praise", "journal", "diary", "polaroid", "self-care", "gratitude", "streak"],
  authors: [{ name: "Praise Journal" }],
  openGraph: {
    title: "Praise Journal",
    description: "Celebrate your daily wins with Polaroid memories",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF6B9D",
};

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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Nanum+Pen+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
