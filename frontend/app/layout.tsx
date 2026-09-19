import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Midnight Intelligence',
  description: 'Practice real cybersecurity decisions and learn from every choice.',
};

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
