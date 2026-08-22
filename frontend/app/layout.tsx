import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CyberGuard AI',
  description: 'Scenario Generation Simulator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-background">
      <body className="bg-background text-primary antialiased">{children}</body>
    </html>
  )
}
