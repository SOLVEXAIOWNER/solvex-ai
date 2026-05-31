import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Solvex AI - Your AI Assistant',
  description: 'Get instant answers, creative ideas, and helpful assistance powered by advanced AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
