'use client'

import { useState, useEffect } from 'react'

// --- TYPES ---
type Order = {
    id: number,
    display_id?: number,
    items: any[],
    total: number,
    details: string,
    worker_id: number,
    status: string,
    created_at: string
}
type Product = {
    id: number, name: string, description: string, image_url: string, category_id: number,
    sizes: { size_name: string, price: number }[],
    option_group_ids: number[],
    is_available: number, is_visible: number,
    price?: number // Display helper
}
type Category = { id: number, name: string, description: string, is_visible: number }

const WORKERS = [
    { id: 1, name: 'Main Barista (Admin)' },
    { id: 2, name: 'Staff A' },
    { id: 3, name: 'Staff B' },
    { id: 4, name: 'Trainee' }
]

export default function Kitchen() {
    const [activeWorker, setActiveWorker] = useState<number | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [subTab, setSubTab] = useState<'pending' | 'preparing' | 'completed'>('pending')
    const [loading, setLoading] = useState(false)

    // --- DATA FETCHING ---
    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders?since=today')
            const data = await res.json()
            setOrders(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchOrders()
        const interval = setInterval(fetchOrders, 5000) // Poll faster (5s) for notifications
        return () => clearInterval(interval)
    }, [])

    const handleUpdateStatus = async (orderId: number, status: string) => {
        if (!activeWorker) return alert('Select Worker First!')
        setLoading(true)
        try {
            await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': '1234' }, // Auto-auth for workers
                body: JSON.stringify({ id: orderId, status, workerId: activeWorker })
            })
            fetchOrders()
        } catch (e) {
            console.error(e)
            alert('Failed to update order')
        } finally {
            setLoading(false)
        }
    }

    // --- DERIVED STATE ---
    const pendingOrders = orders.filter(o => o.status === 'pending_payment' || o.status === 'pending')
    const pendingCount = pendingOrders.length
    const preparingOrders = orders.filter(o => o.status === 'preparing')
    const preparingCount = preparingOrders.length

    // --- LOGIN SCREEN ---
    if (!activeWorker) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Staff Portal</h1>
                    <p className="text-gray-400 mb-8">Who is working right now?</p>
                    <div className="grid grid-cols-2 gap-4">
                        {WORKERS.map(w => (
                            <button
                                key={w.id}
                                onClick={() => setActiveWorker(w.id)}
                                className="p-6 bg-gray-700 rounded-xl text-white font-bold text-xl hover:bg-green-600 transition shadow-lg"
                            >
                                {w.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans flex flex-col h-screen overflow-hidden">
            {/* TOP BAR */}
            <header className="bg-matcha-900 text-white p-3 shadow-md flex justify-between items-center shrink-0">
                <h1 className="text-lg font-bold flex items-center gap-2">
                    <span className="text-xl">☕</span> Hẻm 33 Staff
                    <span className="text-xs bg-matcha-800 px-2 py-1 rounded ml-2 text-matcha-200">
                        {WORKERS.find(w => w.id === activeWorker)?.name}
                    </span>
                </h1>
                <button onClick={() => setActiveWorker(null)} className="bg-red-900/50 hover:bg-red-900 text-red-200 px-3 py-1 rounded text-xs transition">Logout</button>
            </header>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-auto bg-gray-50 p-4">
                <div className="max-w-7xl mx-auto">
                    {/* Sub Tabs */}
                    <div className="flex gap-4 mb-6 border-b pb-2 overflow-x-auto">
                        <button onClick={() => setSubTab('pending')} className={`font-bold pb-2 whitespace-nowrap px-2 ${subTab === 'pending' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400'}`}>
                            Incoming ({pendingCount})
                        </button>
                        <button onClick={() => setSubTab('preparing')} className={`font-bold pb-2 whitespace-nowrap px-2 ${subTab === 'preparing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
                            In Progress ({preparingCount})
                        </button>
                        <button onClick={() => setSubTab('completed')} className={`font-bold pb-2 whitespace-nowrap px-2 ${subTab === 'completed' ? 'text-gray-600 border-b-2 border-gray-600' : 'text-gray-400'}`}>
                            History
                        </button>
                        <button onClick={fetchOrders} className="ml-auto text-blue-500 text-sm hover:underline">Refresh</button>
                    </div>

                    <div className={`grid gap-4 ${subTab === 'preparing' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                        {/* Empty State */}
                        {subTab === 'pending' && pendingOrders.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed">
                                No incoming orders. Time to clean! 🧹
                            </div>
                        )}
                        {subTab === 'preparing' && orders.filter(o => o.status === 'preparing').length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed">
                                No active orders. Pick one from Incoming! 👨‍🍳
                            </div>
                        )}

                        {/* Order Cards */}
                        {orders
                            .filter(o => {
                                if (subTab === 'pending') return o.status === 'pending_payment' || o.status === 'pending'
                                if (subTab === 'preparing') return o.status === 'preparing'
                                return o.status === 'completed'
                            })
                            .map(order => (
                                <div key={order.id} className={`bg-white rounded-xl shadow-lg overflow-hidden flex flex-col animate-slide-up border-t-4 ${order.status === 'completed' ? 'border-gray-400 opacity-70' : order.status === 'preparing' ? 'border-blue-500 shadow-xl scale-[1.01]' : 'border-green-500'}`}>
                                    <div className={`p-3 flex justify-between items-center border-b ${order.status === 'preparing' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                        <span className="font-black text-xl text-gray-800">#{order.display_id || order.id}</span>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-gray-500 font-mono">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {order.status === 'preparing' && <span className="text-xs font-bold text-blue-600 animate-pulse">PREPARING</span>}
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-3 flex-1">
                                        {order.items.map((item: any, idx: number) => (
                                            <div key={idx} className="border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                                <div className={`flex gap-2 font-bold text-gray-800 ${subTab === 'preparing' ? 'text-xl' : ''}`}>
                                                    <span className={`${subTab === 'preparing' ? 'bg-blue-100 text-blue-800 px-3 py-1' : 'bg-green-100 text-green-800 px-2'} rounded h-fit`}>{item.quantity}</span>
                                                    <span>{item?.product?.name || 'Unknown Item'}</span>
                                                </div>
                                                <div className="text-sm text-gray-500 ml-8 mb-1">
                                                    Size: {item?.selectedSize?.size_name || '?'}
                                                </div>
                                                {item.selectedOptions && item.selectedOptions.length > 0 && (
                                                    <div className="ml-8 flex flex-wrap gap-1">
                                                        {item.selectedOptions.map((o: any, i: number) => (
                                                            <span key={i} className={`text-[10px] uppercase font-bold border rounded px-1 py-0.5 ${subTab === 'preparing' ? 'bg-yellow-100 text-yellow-800 border-yellow-300 text-xs' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                                                {o.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {order.details && <div className={`italic mt-2 border-t pt-2 ${subTab === 'preparing' ? 'text-red-500 font-bold text-lg bg-red-50 p-2 rounded' : 'text-xs text-gray-500'}`}>NOTE: {order.details}</div>}
                                    </div>

                                    {/* Footer Action */}
                                    <div className="p-3 bg-gray-50 border-t">
                                        {subTab === 'pending' && (
                                            <button
                                                onClick={() => handleUpdateStatus(order.id, 'preparing')}
                                                disabled={loading}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition transform active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <span>👨‍🍳 START ORDER</span>
                                            </button>
                                        )}
                                        {subTab === 'preparing' && (
                                            <button
                                                onClick={() => handleUpdateStatus(order.id, 'completed')}
                                                disabled={loading}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 text-xl"
                                            >
                                                <span>✅ COMPLETE / SERVE</span>
                                            </button>
                                        )}
                                        {subTab === 'completed' && (
                                            <div className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                                                Completed by #{order.worker_id || '?'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
