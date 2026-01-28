'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [user, setUser] = useState<{ role: string; id: number; name: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
    setUser(storedUser)
    setLoaded(true)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Multiple accounts
    if (username === 'worker1' && password === '1') {
      const userData = { role: 'worker', id: 1, name: 'Worker 1' }
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      router.push('/')
    } else if (username === 'worker2' && password === '2') {
      const userData = { role: 'worker', id: 2, name: 'Worker 2' }
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      router.push('/')
    } else if (username === 'admin' && password === '3') {
      const userData = { role: 'admin', id: 3, name: 'Admin' }
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      router.push('/')
    } else {
      alert('Invalid credentials')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    router.push('/')
  }

  if (!loaded) {
    return <div className="container mx-auto p-8 text-center">Loading...</div>
  }

  if (user) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Logged in as {user.role}</h1>
        <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded">Logout</button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>
        <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Login</button>
      </form>
      <p className="mt-4 text-sm text-gray-600">Worker1: worker1/1, Worker2: worker2/2, Admin: admin/3</p>
    </div>
  )
}