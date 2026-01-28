'use client'

import { useEffect, useState } from 'react'

type CartItem = { item: { name: string }, size: string, sweetness: string, toppings: string[], price: number }

type Order = { id: number, items: string, total: number, details: string, status: string, created_at: string }

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => setOrders(data))
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-green-800 mb-8 text-center">Pending Orders</h1>
      <div className="space-y-6">
        {orders.map(order => {
          const details: CartItem[] = JSON.parse(order.details || '[]')
          return (
            <div key={order.id} className="bg-white border rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Order #{order.id}</h2>
                <span className="text-lg font-semibold text-green-600">Pickup Number: {order.id % 99 + 1}</span>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Items:</h3>
                {details.map((item, index) => (
                  <div key={index} className="mb-2">
                    <p className="font-medium">{item.item.name}</p>
                    <p className="text-sm text-gray-600">Size: {item.size}, Sweetness: {item.sweetness}, Toppings: {item.toppings.join(', ') || 'None'}</p>
                    <p className="text-sm font-semibold">{item.price.toLocaleString()} VND</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Total: {order.total.toLocaleString()} VND</span>
                <span className="text-sm text-gray-500">Ordered at: {new Date(order.created_at).toLocaleString()}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}