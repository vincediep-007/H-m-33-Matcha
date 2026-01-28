'use client'

import { useEffect, useState } from 'react'

export default function Nav() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null')
    setUser(u)
  }, [])

  return (
    <nav className="container mx-auto flex justify-between items-center">
      <h1 className="text-2xl font-bold">Matcha Bliss</h1>
      <div className="space-x-4">
        <a href="/" className="hover:underline">Home</a>
        <a href="/menu" className="hover:underline">Menu</a>
        {user?.role === 'worker' || user?.role === 'admin' ? (
          <a href="/orders" className="hover:underline">Orders</a>
        ) : null}
        {user?.role === 'admin' ? (
          <a href="/admin" className="hover:underline">Admin</a>
        ) : null}
        <a href="/login" className="hover:underline">Login</a>
      </div>
    </nav>
  )
}