'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CartItem } from '../menu/page'

export default function Checkout() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [survey, setSurvey] = useState({ quality: 5, time: 5, manner: 5, overall: 5, comment: '' })
  const [orderId, setOrderId] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'kiosk' | 'vietqr'>('kiosk')
  const [showQrModal, setShowQrModal] = useState(false)
  const router = useRouter()

  // Bank Info (Default Placeholder)
  const BANK_ID = 'MB'
  const ACCOUNT_NO = '123456789'
  const ACCOUNT_NAME = 'HEM 33 SHOP'

  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) setCart(JSON.parse(savedCart))

    // Fetch Settings
    fetch('/api/settings').then(r => r.json()).then(setSettings).catch(e => console.error(e))
  }, [])

  const [settings, setSettings] = useState<any>({})

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const removeItem = (index: number) => {
    const newCart = [...cart]
    newCart.splice(index, 1)
    updateCart(newCart)
  }

  const clearCart = () => {
    if (confirm('Are you sure you want to empty the cart?')) {
      updateCart([])
    }
  }

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0)

  const submitOrder = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          total: total,
          details: `Payment Method: ${paymentMethod.toUpperCase()}`,
          worker_id: 1 // Default
        })
      })

      if (!res.ok) throw new Error('Failed to create order')

      const data = await res.json()
      setOrderId(data.id)

      // Submit Survey (Fire and forget)
      fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.id, ...survey })
      })

      return data.id
    } catch (err) {
      alert('Error placing order. Please try again.')
      setLoading(false)
      return null
    }
  }

  const handleKioskCheckout = async () => {
    if (cart.length === 0) return
    const id = await submitOrder()
    if (id) {
      setSubmitted(true)
      localStorage.removeItem('cart')
    }
  }

  const handleAppPayment = async () => {
    if (cart.length === 0) return
    setShowQrModal(true)
  }

  const confirmAppPayment = async () => {
    // User says they paid via App QR
    const id = await submitOrder()
    if (id) {
      setShowQrModal(false)
      setSubmitted(true)
      localStorage.removeItem('cart')
    }
  }

  const generateVietQR = () => {
    // Generate QR for the current CART total (before order ID is known, or could pre-create order)
    // For simplicity, we just use the amount. Order ID might not be created yet if we show modal first.
    // If we wanted exact Order ID in QR, we'd need to create order first -> then show QR. 
    // Let's stick to Amount-based for "Pay Now" flow.
    const addInfo = `ORDER H33`
    return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-print.png?amount=${total}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
  }

  if (submitted && orderId) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-cream-50 text-center animate-fade-in">
      <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-matcha-500 max-w-md w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-4 bg-pattern opacity-10"></div>

        <div className="text-6xl mb-4 animate-bounce">🎫</div>
        <h1 className="text-2xl font-bold text-matcha-900 mb-2">Order Placed Successfully!</h1>

        <div className="my-8 py-6 bg-matcha-50 rounded-xl border-2 border-dashed border-matcha-300">
          <p className="text-sm font-bold text-matcha-500 uppercase tracking-widest mb-2">Your Order Number</p>
          <div className="text-7xl font-black text-matcha-800 tracking-tighter">#{orderId}</div>
        </div>

        {paymentMethod === 'kiosk' ? (
          <div>
            <p className="text-lg font-bold text-earth-600 mb-4">Please go to the Kiosk to pay.</p>
            <p className="text-sm text-gray-500">Show this number to the staff or enter it on the screen.</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-bold text-green-600 mb-4">Payment Recorded ✅</p>
            <p className="text-sm text-gray-500">Please wait for your drinks.</p>
          </div>
        )}
      </div>
      <button onClick={() => router.push('/')} className="mt-8 text-matcha-600 font-bold hover:underline">Start New Order</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream-50 p-4 md:p-8 pb-32">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="text-matcha-500 mb-6 flex items-center gap-1 font-bold">← Back to Menu</button>

        <h1 className="text-3xl font-serif font-black text-matcha-900 mb-8">Checkout</h1>

        {/* Receipt Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-cream-200">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
            <span className="font-bold text-gray-500">Items ({cart.length})</span>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600 font-bold underline">Empty Cart</button>
            )}
          </div>

          {/* Cart Item List */}
          <div className="space-y-4 mb-4">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-bold text-matcha-900">{item.quantity}x {item.product.name} ({item.selectedSize.size_name})</div>
                  <div className="text-xs text-gray-400">{item.selectedOptions.map(o => o.name).join(', ')}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-bold text-gray-700">{item.totalPrice.toLocaleString()}</span>
                  <button onClick={() => removeItem(idx)} className="text-xs text-red-300 hover:text-red-500">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="font-bold text-xl">Total</span>
            <span className="font-black text-2xl text-matcha-800">{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-matcha-400 uppercase tracking-wider mb-4">Choose Payment</h3>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => setPaymentMethod('kiosk')}
              className={`p-6 rounded-xl border-2 flex items-center justify-between transition group ${paymentMethod === 'kiosk' ? 'border-matcha-600 bg-matcha-50' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl bg-white p-2 rounded-lg shadow-sm">🖥️</span>
                <div className="text-left">
                  <div className={`font-bold text-lg ${paymentMethod === 'kiosk' ? 'text-matcha-900' : 'text-gray-700'}`}>
                    {(settings['enable_qr_payment'] === 'true' || settings['enable_qr_payment'] === true) ? 'Pay at Kiosk / Counter' : 'Send to Kitchen (Cash)'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(settings['enable_qr_payment'] === 'true' || settings['enable_qr_payment'] === true) ? 'Get an Order ID and pay later' : 'Pay via Cash/POS at counter'}
                  </div>
                </div>
              </div>
              {paymentMethod === 'kiosk' && <div className="w-6 h-6 bg-matcha-600 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
            </button>

            {(settings['enable_qr_payment'] === 'true' || settings['enable_qr_payment'] === true) && (
              <button
                onClick={() => setPaymentMethod('vietqr')}
                className={`p-6 rounded-xl border-2 flex items-center justify-between transition group ${paymentMethod === 'vietqr' ? 'border-matcha-600 bg-matcha-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl bg-white p-2 rounded-lg shadow-sm">📱</span>
                  <div className="text-left">
                    <div className={`font-bold text-lg ${paymentMethod === 'vietqr' ? 'text-matcha-900' : 'text-gray-700'}`}>Pay Now (App)</div>
                    <div className="text-xs text-gray-500">Instant transfer via VietQR</div>
                  </div>
                </div>
                {paymentMethod === 'vietqr' && <div className="w-6 h-6 bg-matcha-600 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
              </button>
            )}
          </div>
        </div>

        {/* Survey Section */}
        <div className="mb-8 bg-white p-6 rounded-2xl border border-cream-200">
          <h3 className="text-center font-bold text-matcha-800 mb-6">Quick Feedback (Optional)</h3>
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setSurvey({ ...survey, overall: star })} className={`text-2xl transition ${survey.overall >= star ? 'text-orange-400 scale-110' : 'text-gray-200'}`}>★</button>
            ))}
          </div>
          <textarea className="w-full border border-gray-200 rounded-xl p-3 h-16 focus:ring-2 focus:ring-matcha-500 outline-none text-sm" placeholder="Any comments?" value={survey.comment} onChange={(e) => setSurvey({ ...survey, comment: e.target.value })} />
        </div>

        <button
          disabled={loading}
          onClick={() => {
            if (paymentMethod === 'kiosk') handleKioskCheckout()
            else handleAppPayment()
          }}
          className="w-full bg-matcha-900 text-cream-50 py-5 rounded-2xl font-bold text-xl hover:bg-matcha-800 shadow-xl transition transform active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {loading && <span className="animate-spin">↻</span>}
          {paymentMethod === 'kiosk' ? 'Place Order & Get ID' : 'Proceed to Payment'}
        </button>

        {/* VietQR Modal */}
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white p-8 rounded-2xl max-w-sm w-full shadow-2xl relative">
              <button onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">✕</button>
              <h2 className="text-2xl font-bold text-center text-matcha-900 mb-4">Scan to Pay</h2>
              <div className="bg-white p-2 border-2 border-matcha-200 rounded-xl mb-6 shadow-inner">
                <img src={generateVietQR()} alt="VietQR" className="w-full h-auto rounded-lg" />
              </div>
              <div className="text-center mb-6">
                <div className="text-3xl font-black text-matcha-700">{total.toLocaleString()} VND</div>
              </div>
              <button onClick={confirmAppPayment} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-md">I have paid ✅</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}