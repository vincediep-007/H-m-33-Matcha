'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export type Product = {
  id: number, name: string, description: string, image_url: string, category_id: number,
  sizes: { size_name: string, price: number }[],
  option_group_ids: number[],
  is_available: number, is_visible: number
}
export type Category = { id: number, name: string, description: string, is_visible: number }
export type OptionGroup = {
  id: number, name: string, description: string,
  is_multi_select: number, is_required: number, is_visible: number,
  options: Option[]
}
export type Option = {
  id: number, group_id: number, name: string, description: string,
  price_modifier: number, is_available: number, is_visible: number,
  image_url?: string, price_modifiers_json?: string, image_focus?: string, crop_data?: string
}
export type CartItem = {
  product: Product,
  selectedSize: { size_name: string, price: number },
  selectedOptions: Option[],
  totalPrice: number,
  quantity: number
}

export default function Menu() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [groups, setGroups] = useState<OptionGroup[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCategory, setActiveCategory] = useState<number>(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isCartLoaded, setIsCartLoaded] = useState(false)

  // Customization State
  const [selectedSize, setSelectedSize] = useState<{ size_name: string, price: number } | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([])

  const router = useRouter()

  useEffect(() => {
    // Parallel Fetch
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
      fetch('/api/options').then(r => r.json())
    ]).then(([cats, prods, grps]) => {
      setCategories(cats.filter((c: any) => c.is_visible))
      setProducts(prods.filter((p: any) => p.is_visible))
      setGroups(grps.filter((g: any) => g.is_visible))
      if (cats.length > 0) setActiveCategory(cats[0].id)

      const savedCart = localStorage.getItem('cart')
      if (savedCart) setCart(JSON.parse(savedCart))
      setIsCartLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem('cart', JSON.stringify(cart))
    }
  }, [cart, isCartLoaded])

  const getOptionPrice = (opt: Option) => {
    let price = opt.price_modifier
    if (opt.price_modifiers_json && selectedSize) {
      try {
        const json = JSON.parse(opt.price_modifiers_json)
        if (json[selectedSize.size_name] !== undefined) {
          price = Number(json[selectedSize.size_name])
        }
      } catch (e) { }
    }
    return price
  }

  const calculateTotal = () => {
    if (!selectedProduct || !selectedSize) return 0
    let total = selectedSize.price
    selectedOptions.forEach(opt => {
      total += getOptionPrice(opt)
    })
    return total
  }



  const addToCart = () => {
    if (!selectedProduct || !selectedSize) return

    // Validation: Check Required Groups
    const requiredGroups = selectedProduct.option_group_ids.map(gid => groups.find(g => g.id === gid)).filter(g => g && g.is_required)
    for (const grp of requiredGroups) {
      if (!grp) continue
      const hasSelection = selectedOptions.some(o => o.group_id === grp.id)
      if (!hasSelection) {
        alert(`Please select an option for "${grp.name}"`)
        return
      }
    }

    const newItem: CartItem = {
      product: selectedProduct,
      selectedSize,
      selectedOptions,
      totalPrice: calculateTotal(),
      quantity: 1
    }
    setCart([...cart, newItem])
    setSelectedProduct(null)
  }

  const openProduct = (p: Product) => {
    if (!p.is_available) return
    setSelectedProduct(p)
    setSelectedSize(p.sizes[0] || null)
    setSelectedOptions([])
  }

  const toggleOption = (grp: OptionGroup, opt: Option) => {
    if (!opt.is_available) return
    if (grp.is_multi_select) {
      if (selectedOptions.find(o => o.id === opt.id)) {
        setSelectedOptions(selectedOptions.filter(o => o.id !== opt.id))
      } else {
        setSelectedOptions([...selectedOptions, opt])
      }
    } else {
      // Single select: Remove other options from this group, add new one
      const others = selectedOptions.filter(o => o.group_id !== grp.id)
      if (selectedOptions.find(o => o.id === opt.id)) {
        // If strict required, maybe don't allow deselect? UX choice: allow toggle off.
        setSelectedOptions(others)
      } else {
        setSelectedOptions([...others, opt])
      }
    }
  }

  // Filter products by active category
  const activeProducts = products.filter(p => p.category_id === activeCategory)
  const activeCatDesc = categories.find(c => c.id === activeCategory)?.description

  return (
    <div className="min-h-screen bg-cream-50 font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-matcha-100 px-4 py-4 shadow-sm flex justify-between items-center">
        <h1 className="text-2xl font-black font-serif text-matcha-900 tracking-tight">Hẻm 33</h1>
        <button onClick={() => router.push('/checkout')} className="relative bg-matcha-800 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition">
          Cart ({cart.length})
          {cart.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>}
        </button>
      </header>

      {/* Categories */}
      <div className="sticky top-16 z-30 bg-cream-50/95 py-2 px-4 shadow-sm overflow-x-auto">
        <div className="flex space-x-2">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`whitespace-nowrap px-5 py-2 rounded-full font-bold transition-all text-sm ${activeCategory === c.id ? 'bg-matcha-600 text-white shadow-md transform scale-105' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-100'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto p-4">
        {activeCatDesc && (
          <div className="mb-6 p-4 bg-matcha-50 rounded-xl border-l-4 border-matcha-500 text-matcha-800 italic animate-fade-in shadow-sm">
            &ldquo;{activeCatDesc}&rdquo;
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeProducts.map(p => (
            <div key={p.id} onClick={() => openProduct(p)} className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-50 relative group transition-all duration-300 ${!p.is_available ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-matcha-700">{p.name}</h3>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">{p.description}</p>
                  <div className="font-bold text-matcha-600 text-sm space-y-1">
                    {p.sizes.map((s, i) => (
                      <div key={i} className="flex justify-between w-24">
                        <span className="text-xs text-gray-500">{s.size_name}</span>
                        <span>{s.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Placeholder for Image if we had Product Images */}
                <div className="w-20 h-20 bg-matcha-100 rounded-xl flex items-center justify-center text-2xl shadow-inner">🍵</div>
              </div>
              {!p.is_available && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/50 rounded-2xl backdrop-blur-[1px]">
                  <span className="bg-red-500 text-white px-4 py-1 rounded-full font-bold text-sm shadow-lg rotate-[-10deg] border-2 border-white">SOLD OUT</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative animate-slide-up">

            {/* Modal Header */}
            <div className="bg-matcha-900 text-white p-6 relative shrink-0">
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 rounded-full w-8 h-8 flex items-center justify-center text-sm transition">✕</button>
              <h2 className="text-2xl font-black font-serif mb-1">{selectedProduct.name}</h2>
              <p className="text-matcha-200 text-sm opacity-90">{selectedProduct.description}</p>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-6 space-y-8">

              {/* Size Selection */}
              <div>
                <h3 className="font-bold text-gray-400 text-xs tracking-widest uppercase mb-3">Choose Size</h3>
                <div className="flex gap-3">
                  {selectedProduct.sizes.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSize(s)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${selectedSize?.size_name === s.size_name ? 'border-matcha-600 bg-matcha-50 text-matcha-900 shadow-md' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                    >
                      <span className="font-bold text-lg">{s.size_name}</span>
                      <span className="text-xs">{s.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options Groups */}
              {selectedProduct.option_group_ids.map(gid => {
                const grp = groups.find(g => g.id === gid)
                if (!grp) return null

                // Check if this group has images (Grid Mode)
                const hasImages = grp.options.some(o => o.image_url && o.image_url.length > 5)

                return (
                  <div key={gid}>
                    <h3 className="font-bold text-gray-400 text-xs tracking-widest uppercase mb-3 flex justify-between">
                      {grp.name}
                      {grp.is_required && <span className="text-red-400 font-bold ml-2">* Required</span>}
                    </h3>
                    {grp.description && <p className="text-xs text-gray-400 mb-3 -mt-2">{grp.description}</p>}

                    {hasImages ? (
                      // Grid Layout for Image Options
                      <div className="grid grid-cols-2 gap-3">
                        {grp.options.filter(o => o.is_visible).map(opt => {
                          const isSelected = !!selectedOptions.find(o => o.id === opt.id)
                          let transform = {}
                          if (opt.crop_data) {
                            try {
                              const c = JSON.parse(opt.crop_data)
                              transform = { transform: `scale(${c.scale}) translate(${c.x}%, ${c.y}%)`, transformOrigin: 'center' }
                            } catch (e) { }
                          } else if (opt.image_focus) {
                            transform = { objectPosition: opt.image_focus }
                          }

                          return (
                            <button
                              key={opt.id}
                              disabled={!opt.is_available}
                              onClick={() => toggleOption(grp, opt)}
                              className={`relative p-3 rounded-xl border-2 transition-all text-left flex flex-col gap-2 ${isSelected ? 'border-matcha-500 bg-matcha-50 ring-1 ring-matcha-500' : 'border-gray-100 hover:border-gray-200'} ${!opt.is_available ? 'opacity-50' : ''}`}
                            >
                              {opt.image_url ? (
                                <div className="w-full h-24 rounded-lg bg-gray-100 mb-1 overflow-hidden relative">
                                  <img src={opt.image_url} className="w-full h-full object-cover transition-all" alt={opt.name} style={transform} />
                                </div>
                              ) : <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">🍵</div>}

                              <div>
                                <div className="font-bold text-sm text-gray-800 leading-tight mb-1">{opt.name}</div>
                                {opt.description && <div className="text-[10px] text-gray-500 leading-tight mb-1">{opt.description}</div>}
                                {getOptionPrice(opt) > 0 && <div className="text-xs font-bold text-matcha-600">+{getOptionPrice(opt).toLocaleString()}</div>}
                              </div>
                              {isSelected && <div className="absolute top-2 right-2 bg-matcha-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shadow-md">✓</div>}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      // Standard List Layout
                      <div className="space-y-2">
                        {grp.options.filter(o => o.is_visible).map(opt => {
                          const isSelected = !!selectedOptions.find(o => o.id === opt.id)
                          return (
                            <button
                              key={opt.id}
                              disabled={!opt.is_available}
                              onClick={() => toggleOption(grp, opt)}
                              className={`w-full flex justify-between items-center p-3 rounded-xl border transition-all ${isSelected ? 'border-matcha-500 bg-matcha-50 text-matcha-900 shadow-sm' : 'border-gray-100 text-gray-600 hover:bg-gray-50'} ${!opt.is_available ? 'opacity-50' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${isSelected ? 'bg-matcha-600 border-matcha-600 text-white' : 'border-gray-300'}`}>
                                  {isSelected && '✓'}
                                </div>
                                <div className="text-left">
                                  <span className="font-bold">{opt.name}</span>
                                  {opt.description && <span className="block text-xs text-gray-400 font-normal">{opt.description}</span>}
                                </div>
                              </div>
                              {getOptionPrice(opt) > 0 && <span className="font-mono text-xs font-bold text-matcha-600">+{getOptionPrice(opt).toLocaleString()}</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-white shrink-0">
              <button
                onClick={addToCart}
                className="w-full bg-matcha-800 text-white py-4 rounded-2xl font-bold text-lg hover:bg-matcha-700 shadow-xl transition transform active:scale-95 flex justify-between px-8"
              >
                <span>Add to Cart</span>
                <span>{calculateTotal().toLocaleString()} VND</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}