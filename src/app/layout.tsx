import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Praise Calendar Polaroid",
  description: "A personal daily praise journal with polaroid memories, stickers, and classic Korean teacher stamps",
  keywords: ["praise", "journal", "diary", "polaroid", "self-care", "gratitude", "streak"],
  authors: [{ name: "Praise Calendar" }],
  openGraph: {
    title: "Praise Calendar Polaroid",
    description: "Celebrate your daily wins with Polaroid memories",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fbbf24",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
