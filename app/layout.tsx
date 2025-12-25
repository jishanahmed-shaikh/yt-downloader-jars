import type { Metadata } from 'next'
import { ThemeProvider } from '@/lib/theme-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'YouTube Downloader',
  description: 'Internal tool to download YouTube videos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
