'use client'

import React, { useState } from 'react'

export default function Kiosk() {
    const [inputObj, setInputObj] = useState('')
    const [loading, setLoading] = useState(false)
    const [order, setOrder] = useState<any>(null)
    const [error, setError] = useState('')

    // Bank Info (Should match checkout)
    const BANK_ID = 'MB'
    const ACCOUNT_NO = '123456789'
    const ACCOUNT_NAME = 'HEM 33 SHOP'

    const handleNum = (num: string) => {
        if (inputObj.length < 5) {
            setInputObj(prev => prev + num)
            setError('')
        }
    }

    const handleClear = () => {
        setInputObj('')
        setOrder(null)
        setError('')
    }

    const handleEnter = async () => {
        if (!inputObj) return
        setLoading(true)
        try {
            const res = await fetch(`/api/orders?id=${inputObj}`)
            if (!res.ok) throw new Error('Order not found')
            const data = await res.json()
            // Strict Validation: If items are missing/corrupt, treat as Not Found
            if (!data.items || data.items.length === 0 || !data.items[0]?.product) {
                throw new Error('Invalid Order Data')
            }
            setOrder(data)
        } catch (err) {
            setError('Không tìm thấy đơn, thử lại')
            setInputObj('')
        } finally {
            setLoading(false)
        }
    }

    const generateKioskQR = (total: number, id: number) => {
        const addInfo = `ORDER H33 #${id}` // Specific info for this order
        return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-print.png?amount=${total}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
    }

    // --- RENDER ---

    // 1. Payment View (Order Found)
    if (order) {
        return (
            <div className="min-h-screen bg-matcha-900 flex items-center justify-center p-8">
                <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-4xl w-full flex gap-12 animate-scale-in">
                    {/* Left: Detail */}
                    <div className="flex-1 border-r border-gray-100 pr-12">
                        <div className="inline-block px-4 py-2 bg-matcha-100 text-matcha-800 rounded-lg font-bold mb-6">Order #{order.id}</div>
                        <h2 className="text-4xl font-black text-matcha-900 mb-8">Total: {order.total.toLocaleString()} VND</h2>

                        <ul className="mb-8 space-y-4">
                            {order.items.map((item: any, i: number) => (
                                <li key={i} className="flex justify-between text-lg text-gray-600 border-b border-dashed border-gray-200 pb-2">
                                    <span>{item.quantity}x {item?.product?.name || 'Unknown Item'} ({item?.selectedSize?.size_name || '?'})</span>
                                    <span className="font-bold">{(item?.totalPrice || 0).toLocaleString()}</span>
                                </li>
                            ))}
                        </ul>

                        <button onClick={handleClear} className="w-full py-6 rounded-2xl border-2 border-matcha-200 text-matcha-600 font-bold text-xl hover:bg-matcha-50 transition">
                            ← Scan Next Order
                        </button>
                    </div>

                    {/* Right: QR */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <h3 className="text-2xl font-bold text-matcha-900 mb-6">Scan to Pay</h3>
                        <div className="p-4 bg-white rounded-3xl border-4 border-matcha-500 shadow-xl mb-6">
                            <img src={generateKioskQR(order.total, order.id)} alt="Order Payment QR" className="w-[300px] h-[300px] object-contain" />
                        </div>
                        <p className="text-earth-500 text-lg">Accepting standard Banking Apps & Momo</p>
                    </div>
                </div>
            </div>
        )
    }

    // 2. Numpad View (Waiting for input)
    return (
        <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center font-sans">
            <h1 className="text-matcha-900 text-4xl font-black font-serif mb-2">Hẻm 33 Kiosk</h1>
            <p className="text-earth-500 mb-10 text-xl">Enter Order Number to Pay</p>

            <div className="bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-[500px]">
                {/* Display Screen */}
                <div className={`bg-gray-100 h-24 rounded-2xl mb-8 flex items-center justify-center text-5xl font-mono font-bold tracking-widest text-matcha-800 border-4 ${error ? 'border-red-400 bg-red-50 text-red-500' : 'border-transparent'}`}>
                    {error || (inputObj ? `#${inputObj}` : <span className="text-gray-300">#___</span>)}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNum(num.toString())}
                            className="h-24 rounded-2xl bg-cream-100 text-matcha-900 text-3xl font-bold hover:bg-matcha-200 active:scale-95 transition shadow-sm"
                        >
                            {num}
                        </button>
                    ))}
                    <button onClick={handleClear} className="h-24 rounded-2xl bg-red-100 text-red-600 text-xl font-bold hover:bg-red-200 active:scale-95 transition">CLR</button>
                    <button onClick={() => handleNum('0')} className="h-24 rounded-2xl bg-cream-100 text-matcha-900 text-3xl font-bold hover:bg-matcha-200 active:scale-95 transition">0</button>
                    <button onClick={handleEnter} className="h-24 rounded-2xl bg-matcha-800 text-white text-xl font-bold hover:bg-matcha-700 active:scale-95 transition shadow-lg flex items-center justify-center">
                        {loading ? '...' : 'ENTER'}
                    </button>
                </div>
            </div>

            <div className="mt-8 text-gray-400 text-sm">Staff Mode Protected</div>
        </div>
    )
}
