import type { Metadata } from 'next'
import { Inter, Merriweather } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-merriweather'
})

export const metadata: Metadata = {
  title: 'Hẻm 33 - Matcha & Tea',
  description: 'Premium Matcha & Tea Shop',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${merriweather.variable} font-sans min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  )
}