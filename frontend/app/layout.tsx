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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
