'use client'

import { useState, useEffect } from 'react'

type Category = { id: number, name: string, description: string, is_visible: number, sort_order: number, image_url: string }
type OptionGroup = { id: number, name: string, description: string, is_multi_select: number, is_required: number, is_visible: number, options: Option[] }
type Option = { id: number, group_id: number, name: string, description: string, price_modifier: number, price_modifiers_json: string, is_available: number, is_visible: number, image_url: string, sort_order: number, image_focus: string, crop_data: string }
type ProductSize = { size_name: string, price: number }
type Product = {
  id: number, name: string, category_id: number, category_name: string,
  description: string, image_url: string,
  sizes: ProductSize[], option_group_ids: number[], is_available: number, is_visible: number,
  recipe: { ingredientId: number, quantity: number }[]
}
type Ingredient = { id: number, name: string, cost_per_gram: number }

export default function Admin() {
  const [pin, setPin] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<'categories' | 'options' | 'products' | 'costs' | 'kitchen' | 'settings' | 'analysis'>('categories')

  // Data
  const [categories, setCategories] = useState<Category[]>([])
  const [groups, setGroups] = useState<OptionGroup[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [timeframe, setTimeframe] = useState('week')
  const [customDates, setCustomDates] = useState({ from: '', to: '' })
  const [weekFilter, setWeekFilter] = useState({ week: '', year: new Date().getFullYear().toString() })

  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)

  // Modal State
  const [showCatModal, setShowCatModal] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', description: '', sort_order: 0, imageUrl: '' })

  const [showGroupModal, setShowGroupModal] = useState(false)
  const [groupForm, setGroupForm] = useState({ name: '', description: '', isMultiSelect: false, isRequired: false })

  const [showOptionModal, setShowOptionModal] = useState(false)
  const [optionForm, setOptionForm] = useState({ groupId: 0, name: '', description: '', priceModifier: 0, priceL: 0, price1L3: 0, imageUrl: '', imageFocus: 'center', cropData: { scale: 1, x: 0, y: 0 } })

  const [showProdModal, setShowProdModal] = useState(false)
  const [prodForm, setProdForm] = useState({
    id: 0,
    name: '',
    categoryId: 0,
    description: '',
    imageUrl: '',
    sizes: [] as any[],
    optionGroupIds: [] as number[],
    recipe: [] as { ingredientId: number, quantity: number, sizeName?: string }[]
  })

  // Ingredient Modal & Calculator
  const [showIngModal, setShowIngModal] = useState(false)
  const [ingForm, setIngForm] = useState({ name: '', costPerGram: 0 })
  // Calculator State
  const [calc, setCalc] = useState({ price: 0, currency: 25300, unit: 'g' }) // currency=exchange rate (1 USD = 25300 VND)

  // Settings State
  const [appSettings, setAppSettings] = useState<{ [key: string]: any }>({})

  useEffect(() => {
    const savedPin = localStorage.getItem('admin_pin')
    const checkPin = async (inputPin: string) => {
      setPin(inputPin)
      try {
        const res = await fetch('/api/categories', { headers: { 'X-Admin-Pin': inputPin } })
        if (res.ok) { setIsAuthenticated(true); refreshAllSafe(inputPin) }
      } catch (e) { console.error(e) }
    }
    if (savedPin) checkPin(savedPin)
  }, [])

  const refreshAllSafe = (authPin = pin) => {
    const headers = { 'X-Admin-Pin': authPin }

    // Helper to handle API responses
    const handleResponse = (setFn: any, label: string) => (data: any) => {
      if (data && data.error) {
        console.error(`${label} API Error:`, data.error);
        // alert(`${label} API Error: ${data.error}`);
        setFn([]);
      } else {
        setFn(Array.isArray(data) ? data : []);
      }
    };

    fetch('/api/categories', { headers }).then(r => r.json()).then(handleResponse(setCategories, 'Categories')).catch(() => setCategories([]))
    fetch('/api/options', { headers }).then(r => r.json()).then(handleResponse(setGroups, 'Options')).catch(() => setGroups([]))
    fetch('/api/products', { headers }).then(r => r.json()).then(handleResponse(setProducts, 'Products')).catch(() => setProducts([]))
    fetch('/api/ingredients', { headers }).then(r => r.json()).then(handleResponse(setIngredients, 'Ingredients')).catch(() => setIngredients([]))
    fetch('/api/settings', { headers }).then(r => r.json()).then(setAppSettings).catch(e => console.error(e))
  }

  const toggleSetting = async (key: string, currentValue: any) => {
    const newValue = !currentValue
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin },
        body: JSON.stringify({ action: 'update_setting', key, value: newValue })
      })
      setAppSettings(prev => ({ ...prev, [key]: newValue }))
    } catch (e) { alert('Failed to save setting') }
  }


  const verifyPin = async (inputPin: string) => {
    setPin(inputPin)
    const res = await fetch('/api/categories', { headers: { 'X-Admin-Pin': inputPin } })
    if (res.ok) { setIsAuthenticated(true); localStorage.setItem('admin_pin', inputPin); refreshAllSafe(inputPin) }
    else { if (inputPin) alert('Invalid PIN') }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      return data.url
    } catch (e) {
      alert('Upload failed')
      return null
    } finally {
      setUploading(false)
    }
  }

  // Comparison State
  const [isComparing, setIsComparing] = useState(false)
  const [analyticsDataComp, setAnalyticsDataComp] = useState<any>(null)
  const [timeframe2, setTimeframe2] = useState('week')
  const [customDates2, setCustomDates2] = useState({ from: '', to: '' })
  const [weekFilter2, setWeekFilter2] = useState({ week: '', year: new Date().getFullYear().toString() })

  // Analysis Customization
  const [topN, setTopN] = useState(3)
  const [excludedCats, setExcludedCats] = useState<any[]>([])


  const getReport = async (tf: string, cd: any, wf: any) => {
    try {
      let query = `/api/analytics?timeframe=${tf}`
      if (tf === 'custom' && cd.from && cd.to) {
        query += `&dateFrom=${cd.from}&dateTo=${cd.to}`
      }
      if (tf === 'week_num' && wf.week) {
        const d = new Date(Number(wf.year), 0, 1)
        const days = (Number(wf.week) - 1) * 7
        d.setDate(d.getDate() + days)
        const from = d.toISOString().split('T')[0]
        d.setDate(d.getDate() + 6)
        const to = d.toISOString().split('T')[0]
        query += `&dateFrom=${from}&dateTo=${to}&timeframe=week`
      }
      const res = await fetch(query, { headers: { 'X-Admin-Pin': pin } })
      if (!res.ok) return null
      const data = await res.json()
      return (data && Array.isArray(data.topProducts)) ? data : null
    } catch (e) { console.error(e); return null }
  }

  const fetchAnalytics = async () => {
    const data1 = await getReport(timeframe, customDates, weekFilter)
    setAnalyticsData(data1)

    if (isComparing) {
      const data2 = await getReport(timeframe2, customDates2, weekFilter2)
      setAnalyticsDataComp(data2)
    } else {
      setAnalyticsDataComp(null)
    }
  }

  const exportExcel = () => {
    if (!analyticsData) return
    const rows = [['Type', 'Name', 'Quantity/Count', 'Revenue']]
    analyticsData.topProducts.forEach((p: any) => rows.push(['Product', p.name, p.qty, p.revenue]))
    analyticsData.topOptions.forEach((o: any) => rows.push(['Option', o.name, o.count, '-']))

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `sales_report_${timeframe}.csv`)
    document.body.appendChild(link)
    link.click()
  }

  useEffect(() => {
    if (isAuthenticated) {
      refreshAllSafe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  useEffect(() => {
    if (activeTab === 'analysis') fetchAnalytics()
  }, [activeTab, timeframe])

  // --- ACTIONS ---

  // 1. Categories
  const openNewCat = () => { setEditingId(null); setCatForm({ name: '', description: '', sort_order: 0, imageUrl: '' }); setShowCatModal(true) }
  const openEditCat = (c: Category) => { setEditingId(c.id); setCatForm({ name: c.name, description: c.description, sort_order: c.sort_order, imageUrl: c.image_url || '' }); setShowCatModal(true) }
  const saveCategory = async () => {
    const method = editingId ? 'PUT' : 'POST'
    const body = editingId ? { id: editingId, ...catForm } : catForm
    const res = await fetch('/api/categories', { method, headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) { alert(data.error || 'Failed to save category'); return; }
    setShowCatModal(false); refreshAllSafe()
  }


  // 2. Groups
  const openNewGroup = () => { setEditingId(null); setGroupForm({ name: '', description: '', isMultiSelect: false, isRequired: false }); setShowGroupModal(true) }
  const openEditGroup = (g: OptionGroup) => { setEditingId(g.id); setGroupForm({ name: g.name, description: g.description, isMultiSelect: !!g.is_multi_select, isRequired: !!g.is_required }); setShowGroupModal(true) }
  const saveGroup = async () => {
    const method = editingId ? 'PUT' : 'POST'
    const body = editingId ? { type: 'group', id: editingId, ...groupForm } : { type: 'group', ...groupForm }
    const res = await fetch('/api/options', { method, headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) { alert(data.error || 'Failed to save group'); return; }
    setShowGroupModal(false); refreshAllSafe()
  }


  // 3. Options
  const openNewOption = (gid: number) => { setEditingId(null); setOptionForm({ groupId: gid, name: '', description: '', priceModifier: 0, priceL: 0, price1L3: 0, imageUrl: '', imageFocus: 'center', cropData: { scale: 1, x: 0, y: 0 } }); setShowOptionModal(true) }
  const openEditOption = (o: any) => {
    let priceL = 0, price1L3 = 0
    try {
      const json = JSON.parse(o.price_modifiers_json || '{}')
      priceL = json.L || 0
      price1L3 = json['1L3'] || 0
    } catch (e) { }

    let cropData = { scale: 1, x: 0, y: 0 }
    if (o.crop_data) {
      try { cropData = JSON.parse(o.crop_data) } catch (e) { }
    }

    setEditingId(o.id)
    setOptionForm({ groupId: o.group_id, name: o.name, description: o.description, priceModifier: o.price_modifier, priceL, price1L3, imageUrl: o.image_url || '', imageFocus: o.image_focus || 'center', cropData })
    setShowOptionModal(true)
  }
  const saveOption = async () => {
    const method = editingId ? 'PUT' : 'POST'
    const priceModifiersJson = JSON.stringify({ L: optionForm.priceL, "1L3": optionForm.price1L3 })
    const body = editingId
      ? { type: 'option', id: editingId, ...optionForm, image_url: optionForm.imageUrl, sort_order: 0, priceModifiersJson, image_focus: optionForm.imageFocus, crop_data: JSON.stringify(optionForm.cropData) }
      : { type: 'option', ...optionForm, image_url: optionForm.imageUrl, sort_order: 0, priceModifiersJson, image_focus: optionForm.imageFocus, crop_data: JSON.stringify(optionForm.cropData) }

    const res = await fetch('/api/options', { method, headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) { alert(data.error || 'Failed to save option'); return; }
    setShowOptionModal(false); refreshAllSafe()
  }


  const moveOption = async (id: number, direction: 'up' | 'down') => {
    // Find group and option
    let group: any = null
    let options: any[] = []
    for (const g of groups) {
      const found = g.options.find((o: any) => o.id === id)
      if (found) { group = g; options = [...g.options].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)); break }
    }
    if (!group) return

    const idx = options.findIndex((o: any) => o.id === id)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= options.length) return

    const current = options[idx]
    const neighbor = options[swapIdx]

    // Swap sort_order
    // Simple swap logic:
    // Update ALL in group with new index
    options[idx] = neighbor
    options[swapIdx] = current

    await Promise.all(options.map((o, i) =>
      fetch('/api/options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin },
        body: JSON.stringify({ type: 'option', id: o.id, sort_order: i })
      })
    ))

    refreshAllSafe()
  }

  const handleDelete = async (id: number, type: 'group' | 'option') => {
    if (!confirm('Are you sure?')) return
    await fetch('/api/options', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ id, type }) })
    refreshAllSafe()
  }

  // 4. Products
  const openNewProduct = () => {
    setEditingId(null)
    setProdForm({
      id: 0,
      name: '', categoryId: 0, description: '', imageUrl: '',
      sizes: [{ size_name: 'M', price: 0 }] as any[],
      optionGroupIds: [] as number[],
      recipe: []
    })
    setShowProdModal(true)
  }
  const openEditProduct = (p: Product) => {
    setEditingId(p.id)
    setProdForm({
      id: p.id,
      name: p.name, categoryId: p.category_id, description: p.description, imageUrl: p.image_url || '',
      sizes: p.sizes || [],
      optionGroupIds: p.option_group_ids || [],
      recipe: p.recipe || []
    })
    setShowProdModal(true)
  }
  const saveProduct = async () => {
    const method = editingId ? 'PUT' : 'POST'
    const bodyClone = { ...prodForm } as any
    if (editingId) bodyClone.id = editingId
    bodyClone.sizes = prodForm.sizes.map(s => ({ name: s.size_name, price: Number(s.price) }))

    const res = await fetch('/api/products', { method, headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify(bodyClone) })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Failed to save product');
      return;
    }
    setShowProdModal(false); refreshAllSafe()
  }


  // 5. Ingredients
  const openNewIng = () => { setEditingId(null); setIngForm({ name: '', costPerGram: 0 }); setCalc({ price: 0, currency: 25300, unit: 'g' }); setShowIngModal(true) }
  const openEditIng = (i: Ingredient) => { setEditingId(i.id); setIngForm({ name: i.name, costPerGram: i.cost_per_gram }); setShowIngModal(true) }
  const saveIngredient = async () => {
    const method = editingId ? 'PUT' : 'POST'
    const body = editingId ? { id: editingId, ...ingForm } : ingForm
    const res = await fetch('/api/ingredients', { method, headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) { alert(data.error || 'Failed to save ingredient'); return; }
    setShowIngModal(false); refreshAllSafe()
  }

  const deleteIngredient = async (id: number) => {
    if (!confirm('Delete ingredient?')) return
    await fetch('/api/ingredients', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ id }) })
    refreshAllSafe()
  }

  const applyCalculator = () => {
    let grams = 0
    if (calc.unit === 'g') grams = 1
    if (calc.unit === 'kg') grams = 1000
    if (calc.unit === 'oz') grams = 28.35
    if (calc.unit === 'lb') grams = 453.59

    const totalVND = calc.price * (calc.currency) // if currency is exchange rate
    const costPerG = totalVND / grams
    setIngForm({ ...ingForm, costPerGram: Number(costPerG.toFixed(2)) })
  }

  // Deletes & Toggles
  const deleteCategory = async (id: number) => { if (!confirm('Delete Category?')) return; await fetch('/api/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ id }) }); refreshAllSafe() }
  const deleteGroup = async (id: number) => { if (!confirm('Delete Group?')) return; await fetch('/api/options', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ id, type: 'group' }) }); refreshAllSafe() }
  const deleteOption = async (id: number) => { if (!confirm('Delete Option?')) return; await fetch('/api/options', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ id, type: 'option' }) }); refreshAllSafe() }
  const deleteProduct = async (id: number) => { if (!confirm('Delete Product?')) return; await fetch('/api/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ id }) }); refreshAllSafe() }

  const toggleCat = async (c: Category) => { await fetch('/api/categories', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ id: c.id, is_visible: !c.is_visible }) }); refreshAllSafe() }
  const toggleGroup = async (g: OptionGroup) => { await fetch('/api/options', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ type: 'group', id: g.id, is_visible: !g.is_visible }) }); refreshAllSafe() }
  const toggleOptionVisible = async (o: Option) => { await fetch('/api/options', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ type: 'option', id: o.id, is_visible: !o.is_visible }) }); refreshAllSafe() }
  const toggleOptionStock = async (o: Option) => { await fetch('/api/options', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ type: 'option', id: o.id, is_available: !o.is_available }) }); refreshAllSafe() }
  const toggleProductVisible = async (p: Product) => { await fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ id: p.id, is_visible: !p.is_visible }) }); refreshAllSafe() }
  const toggleProductStock = async (p: Product) => { await fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ id: p.id, is_available: !p.is_available }) }); refreshAllSafe() }

  const handleResetMenu = async () => {
    if (!confirm('DANGER: This will delete ALL Categories, Products, and Options. Are you sure?')) return
    if (!confirm('Double Check: This cannot be undone. Orders will be kept.')) return
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ action: 'reset_menu' }) })
    alert('Menu data cleared.'); refreshAllSafe()
  }

  const handleClearSales = async () => {
    if (!confirm('DANGER: This will delete ALL Order History / Sales Data. Are you sure?')) return
    if (!confirm('Double Check: Revenue data will be lost forever.')) return
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ action: 'reset_sales' }) })
    alert('Sales data cleared.'); refreshAllSafe()
  }

  const getCatName = (id: number) => categories.find(c => c.id === id)?.name || 'Uncategorized'

  if (!isAuthenticated) return <div className="flex justify-center items-center h-screen"><form onSubmit={(e) => { e.preventDefault(); verifyPin(pin) }} className="p-8 border rounded"><h1 className="text-xl mb-4">Admin Access</h1><input type="password" value={pin} onChange={e => setPin(e.target.value)} className="border p-2 w-full mb-4" placeholder="PIN" /><button className="bg-green-600 text-white w-full py-2">Login</button></form></div>

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Advanced Menu Admin</h1>
      <div className="flex space-x-4 border-b mb-8 overflow-x-auto">
        {['categories', 'options', 'products', 'costs', 'kitchen', 'analysis', 'settings'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`capitalize px-4 py-2 ${activeTab === tab ? 'border-b-2 border-green-600 font-bold' : ''}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'categories' && (
        <div>
          <button onClick={openNewCat} className="bg-green-600 text-white px-4 py-2 rounded mb-4">+ Add Category</button>
          <ul className="space-y-2">
            {categories.map(c => (
              <li key={c.id} className={`border p-4 rounded bg-white flex justify-between items-center transition ${c.is_visible ? '' : 'opacity-50 grayscale'}`}>
                <div className="flex gap-4 items-center">
                  {c.image_url && <img src={c.image_url} className="w-12 h-12 rounded bg-gray-100 object-cover" />}
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      {c.name}
                      {!c.is_visible && <span className="text-xs bg-gray-200 px-2 rounded">HIDDEN</span>}
                    </div>
                    {c.description && <div className="text-sm text-gray-500">{c.description}</div>}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => openEditCat(c)} className="text-blue-500" title="Edit">✏️</button>
                  <button onClick={() => toggleCat(c)} title={c.is_visible ? "Hide" : "Show"}>{c.is_visible ? '👁️' : '🙈'}</button>
                  <button onClick={() => deleteCategory(c.id)} className="text-red-500">🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'options' && (
        <div>
          <button onClick={openNewGroup} className="bg-blue-600 text-white px-4 py-2 rounded mb-6">+ New Group</button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(groups || []).map(g => (
              <div key={g.id} className={`border rounded p-4 bg-white relative group transition ${g.is_visible ? '' : 'opacity-60 grayscale'}`}>
                <div className="absolute top-2 right-2 flex gap-2">
                  <button onClick={() => openEditGroup(g)} className="text-blue-500" title="Edit">✏️</button>
                  <button onClick={() => toggleGroup(g)} title="Toggle Visibility">{g.is_visible ? '👁️' : '🙈'}</button>
                  <button onClick={() => deleteGroup(g.id)} className="text-red-500">🗑️</button>
                </div>
                <div className="flex justify-between font-bold mb-1 mr-24">
                  <span>{g.name} {!g.is_visible && '(Hidden)'}</span>
                </div>
                <ul className="pl-4 text-sm mt-4 space-y-2 border-l-2 border-gray-100 ml-1">
                  {g.options.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((o, idx, arr) => (
                    <li key={o.id} className={`flex justify-between hover:bg-gray-50 p-1 rounded items-center ${o.is_visible ? '' : 'opacity-30'}`}>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <button onClick={() => moveOption(o.id, 'up')} disabled={idx === 0} className="text-[10px] text-gray-400 hover:text-black disabled:opacity-0">▲</button>
                          <button onClick={() => moveOption(o.id, 'down')} disabled={idx === arr.length - 1} className="text-[10px] text-gray-400 hover:text-black disabled:opacity-0">▼</button>
                        </div>
                        {o.image_url && <img src={o.image_url} alt={o.name} className="w-8 h-8 rounded object-cover shadow-sm bg-gray-100" />}
                        {o.name}
                        {!o.is_visible && <span className="text-[10px] bg-gray-200 px-1 rounded">HIDDEN</span>}
                        {!o.is_available && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded border border-red-200">SOLD OUT</span>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditOption(o)} className="text-blue-500 text-xs" title="Edit">✏️</button>
                        <button onClick={() => toggleOptionVisible(o)} className="text-gray-400 hover:text-black" title="Visibility">{o.is_visible ? '👁️' : '🙈'}</button>
                        <button onClick={() => toggleOptionStock(o)} className={o.is_available ? "text-green-500 hover:text-green-700" : "text-red-500 hover:text-red-700"} title="Stock Status">{o.is_available ? '📦' : '🚫'}</button>
                        <button onClick={() => deleteOption(o.id)} className="text-red-400">🗑️</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <button onClick={() => openNewOption(g.id)} className="text-sm text-green-600 hover:underline mt-2">+ Add Item</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div>
          <button onClick={openNewProduct} className="bg-green-600 text-white px-4 py-2 rounded mb-4">+ Add Product</button>

          {/* Grouped Products */}
          {categories.map(cat => {
            const catProducts = products.filter(p => p.category_id == cat.id)
            if (catProducts.length === 0) return null

            return (
              <div key={cat.id} className="mb-8">
                <div className="flex items-center gap-3 mb-4 border-b pb-2">
                  {cat.image_url && <img src={cat.image_url} alt={cat.name} className="w-8 h-8 rounded-full object-cover" />}
                  <h2 className="text-2xl font-bold text-gray-800">{cat.name}</h2>
                </div>
                <div className="space-y-4">
                  {catProducts.map(p => (
                    <div key={p.id} className={`border p-4 rounded flex justify-between items-center bg-white transition ${p.is_visible ? '' : 'opacity-40 grayscale'} ${p.is_available ? '' : 'bg-red-50'}`}>
                      <div className="flex items-center gap-4">
                        {p.image_url && <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded object-cover shadow bg-gray-100" />}
                        <div>
                          <h3 className="font-bold flex gap-2 items-center">
                            {p.name}
                            {!p.is_visible && <span className="text-xs bg-gray-200 px-2 rounded">HIDDEN</span>}
                            {!p.is_available && <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-2 rounded">SOLD OUT</span>}
                          </h3>
                          <div className="text-sm text-gray-500 flex gap-4">
                            <span>{p.sizes.map(s => `${s.size_name}: ${s.price.toLocaleString()}`).join(' / ')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => openEditProduct(p)} className="text-blue-500 text-xl" title="Edit">✏️</button>
                        <button onClick={() => toggleProductVisible(p)} title="Visibility" className="text-xl">{p.is_visible ? '👁️' : '🙈'}</button>
                        <button onClick={() => toggleProductStock(p)} title="Stock Status" className="text-xl">{p.is_available ? '📦' : '🚫'}</button>
                        <button onClick={() => deleteProduct(p.id)} className="text-red-500 text-xl">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {products.filter(p => !p.category_id || !categories.find(c => c.id == p.category_id)).length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-400 mb-4 border-b pb-2">Uncategorized</h2>
              <div className="space-y-4">
                {products.filter(p => !p.category_id || !categories.find(c => c.id == p.category_id)).map(p => (

                  <div key={p.id} className="border p-4 rounded flex justify-between bg-gray-50">
                    <span>{p.name}</span>
                    <div className="flex gap-4">
                      <button onClick={() => openEditProduct(p)} className="text-blue-500 text-xl" title="Edit">✏️</button>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-500 text-xl">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'costs' && (
        <div className="max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Ingredient Costs</h2>
            <button onClick={openNewIng} className="bg-blue-600 text-white px-4 py-2 rounded">+ Add Ingredient</button>
          </div>
          <div className="bg-white rounded shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-sm uppercase text-gray-500">
                <tr>
                  <th className="p-4">Ingredient Name</th>
                  <th className="p-4">Cost / Gram (VND)</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map(i => (
                  <tr key={i.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-bold">{i.name}</td>
                    <td className="p-4">{i.cost_per_gram.toLocaleString()} đ/g</td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEditIng(i)} className="text-blue-500 mr-4">Edit</button>
                      <button onClick={() => deleteIngredient(i.id)} className="text-red-500">🗑️</button>
                    </td>
                  </tr>
                ))}
                {ingredients.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-gray-400">No ingredients yet. Add one to start costing.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'kitchen' && (
        <div className="text-center p-8 text-gray-400">
          <p>Go to <a href="/kitchen" className="text-blue-500 underline">/kitchen</a> for the separate Worker Interface.</p>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Global Application Settings</h2>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-matcha-900">Enable QR Payment (Pay Now)</h3>
                <p className="text-sm text-gray-500">Allow customers to pay instantly via VietQR app integration.</p>
              </div>
              <button
                onClick={() => toggleSetting('enable_qr_payment', appSettings['enable_qr_payment'] === 'true' || appSettings['enable_qr_payment'] === true)}
                className={`w-14 h-8 rounded-full transition p-1 flex items-center ${appSettings['enable_qr_payment'] === 'true' || appSettings['enable_qr_payment'] === true ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}
              >
                <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-matcha-900">Show Landing Page QR</h3>
                <p className="text-sm text-gray-500">Display the &quot;Scan to Order&quot; QR code on the main landing page.</p>
              </div>
              <button
                onClick={() => toggleSetting('show_landing_qr', appSettings['show_landing_qr'] === 'true' || appSettings['show_landing_qr'] === true)}
                className={`w-14 h-8 rounded-full transition p-1 flex items-center ${appSettings['show_landing_qr'] === 'true' || appSettings['show_landing_qr'] === true ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}
              >
                <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
              </button>
            </div>

            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 mt-8">
              <h3 className="font-bold text-yellow-800 mb-2">Danger Zone</h3>
              <p className="text-sm text-yellow-700 mb-4">Resetting data cannot be undone. Be careful.</p>
              <div className="flex gap-4">
                <button onClick={() => { if (confirm('Reset MENU only?')) { /* logic here */ } }} className="bg-white border border-red-200 text-red-500 px-4 py-2 rounded text-sm hover:bg-red-50">Reset Menu Data</button>
                <button onClick={() => { if (confirm('Reset SALES History?')) { /* logic here */ } }} className="bg-white border border-red-200 text-red-500 px-4 py-2 rounded text-sm hover:bg-red-50">Reset Sales Data</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-8">
          {/* Controls */}
          <div className="bg-white p-6 rounded shadow-sm">
            <div className="flex flex-wrap gap-4 items-end justify-between">
              <div className="flex gap-4 items-end flex-wrap">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">PERIOD</label>
                  <select className="border p-2 rounded w-40" value={timeframe} onChange={e => setTimeframe(e.target.value)}>
                    <option value="today">Today (VN)</option>
                    <option value="yesterday">Yesterday (VN)</option>
                    <option value="week">Past 7 Days</option>
                    <option value="month">Past 30 Days</option>
                    <option value="quarter">Past Quarter</option>
                    <option value="year">Past Year</option>
                    <option value="week_num">Specific Week</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {timeframe === 'custom' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">FROM</label>
                      <input type="date" className="border p-2 rounded" value={customDates.from} onChange={e => setCustomDates({ ...customDates, from: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">TO</label>
                      <input type="date" className="border p-2 rounded" value={customDates.to} onChange={e => setCustomDates({ ...customDates, to: e.target.value })} />
                    </div>
                  </>
                )}

                {timeframe === 'week_num' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">YEAR</label>
                      <input type="number" className="border p-2 rounded w-20" value={weekFilter.year} onChange={e => setWeekFilter({ ...weekFilter, year: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">WEEK (1-52)</label>
                      <input type="number" min="1" max="52" className="border p-2 rounded w-20" value={weekFilter.week} onChange={e => setWeekFilter({ ...weekFilter, week: e.target.value })} />
                    </div>
                  </>
                )}

                <button onClick={fetchAnalytics} className="bg-blue-600 text-white px-4 py-2 rounded h-10 mb-[1px]">Apply Filter</button>
              </div>

              {/* Comparison Toggle */}
              <div className="flex items-center gap-2 mb-1">
                <input type="checkbox" id="compare" className="w-4 h-4" checked={isComparing} onChange={e => setIsComparing(e.target.checked)} />
                <label htmlFor="compare" className="font-bold text-gray-700 cursor-pointer">Compare</label>
              </div>

              {isComparing && (
                <div className="flex gap-4 items-end flex-wrap border-t pt-4 w-full animate-slide-up">
                  <div className="text-xs font-bold text-blue-500 mb-1 w-full uppercase">Comparison Period</div>
                  <div>
                    <select className="border p-2 rounded w-40" value={timeframe2} onChange={e => setTimeframe2(e.target.value)}>
                      <option value="week">Past 7 Days</option>
                      <option value="month">Past 30 Days</option>
                      <option value="quarter">Past Quarter</option>
                      <option value="year">Past Year</option>
                      <option value="week_num">Specific Week</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {timeframe2 === 'custom' && (
                    <>
                      <input type="date" className="border p-2 rounded" value={customDates2.from} onChange={e => setCustomDates2({ ...customDates2, from: e.target.value })} />
                      <input type="date" className="border p-2 rounded" value={customDates2.to} onChange={e => setCustomDates2({ ...customDates2, to: e.target.value })} />
                    </>
                  )}

                  {timeframe2 === 'week_num' && (
                    <>
                      <input type="number" className="border p-2 rounded w-20" value={weekFilter2.year} onChange={e => setWeekFilter2({ ...weekFilter2, year: e.target.value })} />
                      <input type="number" min="1" max="52" className="border p-2 rounded w-20" value={weekFilter2.week} onChange={e => setWeekFilter2({ ...weekFilter2, week: e.target.value })} />
                    </>
                  )}
                </div>
              )}

              {/* Customization Settings */}
              <div className="w-full border-t pt-4 mt-2">
                <div className="flex flex-wrap gap-6 items-start">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">TOP PRODUCTS</label>
                    <input type="number" min="3" max="20" className="border p-2 rounded w-20" value={topN} onChange={e => setTopN(Number(e.target.value))} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-400 mb-1">VISIBLE CATEGORIES</label>
                    <div className="flex gap-2 flex-wrap">
                      {categories.map(c => (
                        <label key={c.id} className={`text-xs px-2 py-1 rounded border cursor-pointer select-none transition ${!excludedCats.includes(c.id) ? 'bg-matcha-100 border-matcha-300 text-matcha-800 font-bold' : 'bg-gray-50 text-gray-400'}`}>
                          <input type="checkbox" className="hidden" checked={!excludedCats.includes(c.id)} onChange={() => {
                            if (excludedCats.includes(c.id)) setExcludedCats(excludedCats.filter(id => id !== c.id))
                            else setExcludedCats([...excludedCats, c.id])
                          }} />
                          {c.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ml-auto">
                {analyticsData && <button onClick={exportExcel} className="bg-green-600 text-white px-4 py-2 rounded h-10">Export CSV</button>}
              </div>
            </div>
          </div>

          {!analyticsData || analyticsData.topProducts?.length === 0 ? (
            <div className="p-12 text-center text-gray-400 bg-white rounded border border-dashed">
              <p className="text-xl mb-2">📊 No Data Available</p>
              <p>Try adjusting the filters above.</p>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded shadow-sm border-l-4 border-green-500">
                  <h3 className="text-gray-500 text-sm font-bold uppercase mb-2">Total Revenue</h3>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold">{analyticsData.totalRevenue?.toLocaleString()} <span className="text-sm font-normal text-gray-400">VND</span></p>
                    {isComparing && analyticsDataComp && (
                      <div className={`text-sm font-bold px-2 py-1 rounded ${analyticsData.totalRevenue >= analyticsDataComp.totalRevenue ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {((analyticsData.totalRevenue - analyticsDataComp.totalRevenue) / (analyticsDataComp.totalRevenue || 1) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  {isComparing && analyticsDataComp && <div className="text-xs text-gray-400 mt-1">vs {analyticsDataComp.totalRevenue?.toLocaleString()}</div>}
                </div>

                <div className="bg-white p-6 rounded shadow-sm border-l-4 border-blue-500">
                  <h3 className="text-gray-500 text-sm font-bold uppercase mb-2">Total Income (Profit)</h3>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold">{analyticsData.totalIncome?.toLocaleString()} <span className="text-sm font-normal text-gray-400">VND</span></p>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Total Cost: {analyticsData.totalCost?.toLocaleString()}</div>
                </div>

                <div className="bg-white p-6 rounded shadow-sm border-l-4 border-blue-500">
                  <h3 className="text-gray-500 text-sm font-bold uppercase mb-2">Total Items Sold</h3>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold">{analyticsData.topProducts.reduce((acc: number, p: any) => acc + p.qty, 0)}</p>
                    {isComparing && analyticsDataComp && (
                      <div className={`text-sm font-bold px-2 py-1 rounded bg-gray-100`}>
                        vs {analyticsDataComp.topProducts.reduce((acc: number, p: any) => acc + p.qty, 0)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Chart */}
              <div className="bg-white p-6 rounded shadow-sm">
                <h3 className="font-bold mb-6 border-b pb-2 text-lg">Hit Items (Top {topN})</h3>
                <div className="space-y-4">
                  {analyticsData.topProducts
                    .filter((p: any) => {
                      const cat = categories.find(c => c.name === p.category)
                      return !cat || !excludedCats.includes(cat.id)
                    })
                    .slice(0, topN).map((p: any, i: number) => {
                      const max = analyticsData.topProducts[0].qty;
                      const percent = (p.qty / max) * 100;
                      const colors = ['bg-yellow-400', 'bg-gray-400', 'bg-orange-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400'];
                      return (
                        <div key={i} className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${colors[i % colors.length] || 'bg-blue-500'}`}>#{i + 1}</div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="font-bold text-gray-800">{p.name}</span>
                              <span className="text-sm text-gray-500">{p.qty} sold</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${colors[i % colors.length] || 'bg-blue-500'}`} style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Detailed Breakdown Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Category Analysis */}
                <div className="bg-white p-6 rounded shadow-sm">
                  <h3 className="font-bold mb-4 border-b pb-2 flex items-center gap-2">📂 Category Performance <span className="text-xs font-normal text-gray-500 ml-auto">Revenue Sorted</span></h3>
                  <div className="space-y-4">
                    {analyticsData.categoryAnalysis
                      ?.filter((c: any) => {
                        const catObj = categories.find(cat => cat.name === c.category)
                        return !catObj || !excludedCats.includes(catObj.id)
                      })
                      .map((c: any, i: number) => (
                        <div key={i} className="border p-3 rounded-lg flex flex-col gap-2 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-lg">{c.category}</span>
                            <span className="font-bold text-green-600">{c.revenue.toLocaleString()}</span>
                          </div>
                          <div className="text-sm text-gray-500 flex justify-between bg-gray-100 p-2 rounded">
                            <span>🏆 Best Seller: <strong className="text-gray-700">{c.bestSeller?.name || 'None'}</strong></span>
                            <span>({c.bestSeller?.qty || 0})</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Option Group Analysis */}
                <div className="bg-white p-6 rounded shadow-sm">
                  <h3 className="font-bold mb-4 border-b pb-2 flex items-center gap-2">🎨 Customization Trends <span className="text-xs font-normal text-gray-500 ml-auto">Usage Sorted</span></h3>
                  <div className="space-y-4">
                    {analyticsData.groupAnalysis?.map((g: any, i: number) => (
                      <div key={i} className="border p-3 rounded-lg flex flex-col gap-2 hover:bg-gray-50">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800">{g.group}</span>
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{g.totalUsage} picks</span>
                        </div>
                        {g.bestOption && (
                          <div className="text-sm flex items-center gap-2 mt-1">
                            <span className="text-gray-400">Most Popular:</span>
                            <span className="font-bold text-matcha-600">{g.bestOption.name}</span>
                            <span className="text-xs text-gray-400">({g.bestOption.qty})</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Full Product List */}
              <div className="bg-white p-6 rounded shadow-sm">
                <h3 className="font-bold mb-4">Detailed Product Sales</h3>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 bg-white shadow-sm">
                      <tr className="text-gray-500 border-b">
                        <th className="pb-2">Product</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topProducts.map((p: any, i: number) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-2 font-medium">{p.name}</td>
                          <td className="py-2 text-gray-500 text-xs uppercase">{p.category}</td>
                          <td className="py-2">{p.qty}</td>
                          <td className="py-2 text-right text-matcha-700">{p.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white p-8 rounded shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">System Settings</h2>
          <div className="mb-8 border-b pb-8">
            <h3 className="font-bold text-lg mb-2">Reset Menu Data</h3>
            <p className="text-gray-500 mb-4">Use this if the menu is corrupted or if you want to start fresh to re-seed from the script. <br /><strong>This does not delete Orders.</strong></p>
            <button onClick={handleResetMenu} className="bg-red-100 text-red-700 px-6 py-3 rounded-lg font-bold border border-red-200 hover:bg-red-200 transition">⚠️ Reset / Clear Menu</button>
          </div>

          <div className="mb-8 border-b pb-8">
            <h3 className="font-bold text-lg mb-2">Clear Sales History</h3>
            <p className="text-gray-500 mb-4">Clear all orders and revenue data to start fresh. <br /><strong>Menu items will be preserved.</strong></p>
            <button onClick={handleClearSales} className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition shadow-lg">🔥 Clear Sales Data</button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded w-96 animate-scale-in shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold mb-4 text-xl">{editingId ? 'Edit' : 'New'} Category</h3>

            <label className="block text-xs font-bold text-gray-400 mb-1">NAME</label>
            <input className="border w-full p-2 mb-4 rounded" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} placeholder="Category Name" />

            <label className="block text-xs font-bold text-gray-400 mb-1">DESCRIPTION</label>
            <textarea className="border w-full p-2 mb-4 h-20 rounded" value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} placeholder="Description (optional)" />

            {/* Upload */}
            <label className="block text-xs font-bold text-gray-400 mb-1">IMAGE</label>
            <div className="mb-4">
              {catForm.imageUrl && <img src={catForm.imageUrl} className="w-full h-32 object-cover rounded mb-2 border" />}
              <input type="file" className="text-xs" onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const url = await handleUpload(e.target.files[0])
                  if (url) setCatForm({ ...catForm, imageUrl: url })
                }
              }} />
              {uploading && <span className="text-xs text-blue-500 ml-2">Uploading...</span>}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCatModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
              <button onClick={saveCategory} className="bg-matcha-600 text-white px-6 py-2 rounded font-bold hover:bg-matcha-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded w-96 animate-scale-in shadow-xl">
            <h3 className="font-bold mb-4 text-xl">{editingId ? 'Edit' : 'New'} Option Group</h3>
            <input className="border w-full p-2 mb-4 rounded" value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="Group Name (e.g. Sugar Level)" />
            <textarea className="border w-full p-2 mb-4 rounded h-16" value={groupForm.description} onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} placeholder="Instruction (e.g. Choose one)" />
            <div className="space-y-2 mb-6">
              <label className="flex items-center gap-2"><input type="checkbox" checked={groupForm.isMultiSelect} onChange={e => setGroupForm({ ...groupForm, isMultiSelect: e.target.checked })} /> Allow Multiple Selection</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={groupForm.isRequired} onChange={e => setGroupForm({ ...groupForm, isRequired: e.target.checked })} /> Required</label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowGroupModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
              <button onClick={saveGroup} className="bg-matcha-600 text-white px-6 py-2 rounded font-bold hover:bg-matcha-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {showOptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded w-96 animate-scale-in shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold mb-4 text-xl">{editingId ? 'Edit' : 'New'} Option Item</h3>

            <label className="block text-xs font-bold text-gray-400 mb-1">NAME</label>
            <input className="border w-full p-2 mb-4 rounded" value={optionForm.name} onChange={e => setOptionForm({ ...optionForm, name: e.target.value })} placeholder="Item Name (e.g. 50%)" />

            <label className="block text-xs font-bold text-gray-400 mb-1">DESCRIPTION</label>
            <input className="border w-full p-2 mb-4 rounded" value={optionForm.description} onChange={e => setOptionForm({ ...optionForm, description: e.target.value })} placeholder="Description (optional)" />

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-400 mb-1">IMAGE</label>
              {optionForm.imageUrl && (
                <div className="mb-2">
                  <div className="w-full h-32 rounded border overflow-hidden bg-gray-100 relative">
                    <img
                      src={optionForm.imageUrl}
                      className="w-full h-full object-cover transition-all"
                      style={{
                        transform: `scale(${optionForm.cropData?.scale || 1}) translate(${optionForm.cropData?.x || 0}%, ${optionForm.cropData?.y || 0}%)`,
                        transformOrigin: 'center'
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2 mb-2">
                <input type="file" className="text-xs flex-1" onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await handleUpload(e.target.files[0])
                    if (url) setOptionForm({ ...optionForm, imageUrl: url })
                  }
                }} />
                {uploading && <span className="text-xs text-blue-500 self-center">Uploading...</span>}
              </div>

              <div className="bg-gray-50 p-3 rounded border mb-2">
                <label className="block text-xs font-bold text-gray-400 mb-2">ADVANCED CROP & ZOOM</label>

                {/* Zoom */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs w-12 font-bold">Zoom: {(optionForm.cropData?.scale || 1).toFixed(1)}x</span>
                  <input type="range" min="1" max="3" step="0.1" className="flex-1"
                    value={optionForm.cropData?.scale || 1}
                    onChange={e => setOptionForm({ ...optionForm, cropData: { ...optionForm.cropData, scale: parseFloat(e.target.value) } })}
                  />
                </div>

                {/* Pan X */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs w-12 font-bold">Pan X: {optionForm.cropData?.x || 0}%</span>
                  <input type="range" min="-50" max="50" step="1" className="flex-1"
                    value={optionForm.cropData?.x || 0}
                    onChange={e => setOptionForm({ ...optionForm, cropData: { ...optionForm.cropData, x: parseInt(e.target.value) } })}
                  />
                </div>

                {/* Pan Y */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs w-12 font-bold">Pan Y: {optionForm.cropData?.y || 0}%</span>
                  <input type="range" min="-50" max="50" step="1" className="flex-1"
                    value={optionForm.cropData?.y || 0}
                    onChange={e => setOptionForm({ ...optionForm, cropData: { ...optionForm.cropData, y: parseInt(e.target.value) } })}
                  />
                </div>

                <button onClick={() => setOptionForm({ ...optionForm, cropData: { scale: 1, x: 0, y: 0 } })} className="text-xs text-blue-500 underline">Reset Crop</button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-400 mb-1">PRICE MODIFIER (BASE/M) (+)</label>
              <input type="number" className="border w-full p-2 rounded" value={optionForm.priceModifier} onChange={e => setOptionForm({ ...optionForm, priceModifier: Number(e.target.value) })} placeholder="0" />
            </div>
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 mb-1">PRICE (L) (+)</label>
                <input type="number" className="border w-full p-2 rounded" value={optionForm.priceL} onChange={e => setOptionForm({ ...optionForm, priceL: Number(e.target.value) })} placeholder="0" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 mb-1">PRICE (1L3) (+)</label>
                <input type="number" className="border w-full p-2 rounded" value={optionForm.price1L3} onChange={e => setOptionForm({ ...optionForm, price1L3: Number(e.target.value) })} placeholder="0" />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowOptionModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
              <button onClick={saveOption} className="bg-matcha-600 text-white px-6 py-2 rounded font-bold hover:bg-matcha-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {showProdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-scale-in shadow-2xl">

            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="font-bold text-2xl text-matcha-900">{editingId ? 'Edit' : 'New'} Product</h3>
              <button onClick={() => setShowProdModal(false)} className="text-gray-400 hover:text-red-500 text-2xl">×</button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: Product Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">PRODUCT NAME</label>
                    <input className="border w-full p-3 rounded-lg bg-gray-50" placeholder="e.g. Matcha Latte" value={prodForm.name} onChange={e => setProdForm({ ...prodForm, name: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">CATEGORY</label>
                    <select className="border w-full p-3 rounded-lg bg-gray-50" value={prodForm.categoryId} onChange={e => setProdForm({ ...prodForm, categoryId: Number(e.target.value) })}>
                      <option value={0}>Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">DESCRIPTION</label>
                    <textarea className="border w-full p-3 rounded-lg bg-gray-50 h-20" placeholder="e.g. Best seller..." value={prodForm.description} onChange={e => setProdForm({ ...prodForm, description: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">PRODUCT IMAGE</label>
                    <div className="mb-4">
                      {prodForm.imageUrl && <img src={prodForm.imageUrl} className="w-full h-40 object-cover rounded mb-2 border" />}
                      <input type="file" className="text-xs" onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          const url = await handleUpload(e.target.files[0])
                          if (url) setProdForm({ ...prodForm, imageUrl: url })
                        }
                      }} />
                      {uploading && <span className="text-xs text-blue-500 ml-2">Uploading...</span>}
                    </div>
                  </div>

                  <div className="border p-4 rounded-xl bg-gray-50">
                    <label className="block text-xs font-bold text-gray-400 mb-2">SIZES & PRICES</label>
                    {prodForm.sizes.map((s, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <input className="border p-2 rounded w-1/3 text-sm" placeholder="Size (M)" value={s.size_name} onChange={e => { const newSizes = [...prodForm.sizes]; newSizes[idx].size_name = e.target.value; setProdForm({ ...prodForm, sizes: newSizes }) }} />
                        <input className="border p-2 rounded w-1/3 text-sm" type="number" placeholder="Price" value={s.price} onChange={e => { const newSizes = [...prodForm.sizes]; newSizes[idx].price = Number(e.target.value); setProdForm({ ...prodForm, sizes: newSizes }) }} />
                        <button onClick={() => { const newSizes = prodForm.sizes.filter((_, i) => i !== idx); setProdForm({ ...prodForm, sizes: newSizes }) }} className="text-red-400 hover:text-red-600">×</button>
                      </div>
                    ))}
                    <button onClick={() => setProdForm({ ...prodForm, sizes: [...prodForm.sizes, { size_name: '', price: 0 }] })} className="text-sm text-green-600 font-bold hover:underline">+ Add Size</button>
                  </div>
                </div>

                {/* Right: Recipe & Linking */}
                <div className="flex-1 space-y-6">
                  <div className="flex gap-4">
                    {/* Available Groups */}
                    <div className="flex-1 border p-4 rounded-xl bg-gray-50 h-64 flex flex-col">
                      <label className="block text-xs font-bold text-gray-400 mb-2">AVAILABLE GROUPS</label>
                      <div className="overflow-y-auto flex-1 space-y-1">
                        {groups.filter(g => !prodForm.optionGroupIds.find(gid => String(gid) == String(g.id))).map(g => (
                          <button key={g.id} onClick={() => setProdForm({ ...prodForm, optionGroupIds: [...prodForm.optionGroupIds, g.id] })} className="w-full text-left text-sm p-2 hover:bg-green-100 rounded border border-transparent hover:border-green-200 transition bg-white">
                            + {g.name}
                          </button>
                        ))}
                        {groups.filter(g => !prodForm.optionGroupIds.find(gid => String(gid) == String(g.id))).length === 0 && <span className="text-xs text-gray-400 italic p-2">All groups selected</span>}

                      </div>
                    </div>

                    {/* Selected Groups (Ordered) */}
                    <div className="flex-1 border p-4 rounded-xl bg-white h-64 flex flex-col border-green-500 shadow-sm">
                      <label className="block text-xs font-bold text-green-700 mb-2">SELECTED GROUPS (ORDERED)</label>
                      <div className="overflow-y-auto flex-1 space-y-1">
                        {prodForm.optionGroupIds.map((gid, idx) => {
                          const g = groups.find(gp => String(gp.id) == String(gid));
                          if (!g) return null

                          return (
                            <div key={gid} className="flex justify-between items-center text-sm p-2 bg-green-50 rounded border border-green-100">
                              <span className="font-bold">{idx + 1}. {g.name}</span>
                              <div className="flex gap-1">
                                <button onClick={() => {
                                  if (idx === 0) return
                                  const newIds = [...prodForm.optionGroupIds]
                                  const temp = newIds[idx]
                                  newIds[idx] = newIds[idx - 1]
                                  newIds[idx - 1] = temp
                                  setProdForm({ ...prodForm, optionGroupIds: newIds })
                                }} disabled={idx === 0} className="text-xs px-1 hover:bg-green-200 rounded disabled:opacity-30">▲</button>
                                <button onClick={() => {
                                  if (idx === prodForm.optionGroupIds.length - 1) return
                                  const newIds = [...prodForm.optionGroupIds]
                                  const temp = newIds[idx]
                                  newIds[idx] = newIds[idx + 1]
                                  newIds[idx + 1] = temp
                                  setProdForm({ ...prodForm, optionGroupIds: newIds })
                                }} disabled={idx === prodForm.optionGroupIds.length - 1} className="text-xs px-1 hover:bg-green-200 rounded disabled:opacity-30">▼</button>
                                <button onClick={() => setProdForm({ ...prodForm, optionGroupIds: prodForm.optionGroupIds.filter(id => String(id) != String(gid)) })} className="text-xs text-red-500 hover:bg-red-100 px-2 rounded ml-2">×</button>

                              </div>
                            </div>
                          )
                        })}
                        {prodForm.optionGroupIds.length === 0 && <span className="text-xs text-gray-400 italic p-2">No groups selected</span>}
                      </div>
                    </div>
                  </div>

                  <div className="border p-4 rounded-xl bg-blue-50 border-blue-100">
                    <label className="block text-xs font-bold text-blue-800 mb-2 flex justify-between">
                      <span> RECIPE & COST</span>
                      <span className="text-xs font-normal">Base Cost Calc</span>
                    </label>

                    {/* List of Ingredients Added */}
                    <div className="space-y-3 mb-4">
                      {/* Find unique ingredients in the recipe array */}
                      {Array.from(new Set(prodForm.recipe.map((r: any) => r.ingredientId))).map((ingId: any) => {
                        const ing = ingredients.find((i: any) => i.id === ingId)
                        if (!ing) return null

                        return (
                          <div key={ingId} className="bg-white p-3 rounded border shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <div className="font-bold text-gray-700">{ing.name}</div>
                              <button onClick={() => {
                                const newRec = prodForm.recipe.filter((r: any) => r.ingredientId !== ingId)
                                setProdForm({ ...prodForm, recipe: newRec })
                              }} className="text-red-400 text-xs hover:text-red-600">Remove Ingredient</button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {prodForm.sizes.map((size: any) => {
                                const recItem = prodForm.recipe.find((r: any) => r.ingredientId === ingId && (r.sizeName === size.size_name || (!r.sizeName && !size.size_name)))
                                const qty = recItem ? recItem.quantity : 0
                                const cost = (qty * ing.cost_per_gram)

                                return (
                                  <div key={size.size_name} className="flex flex-col">
                                    <label className="text-[10px] text-gray-400 uppercase font-bold">{size.size_name || 'Base'}</label>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        className="border p-1 rounded w-full text-sm"
                                        placeholder="0"
                                        value={qty || ''}
                                        onChange={(e) => {
                                          const val = Number(e.target.value)
                                          let newRec = [...prodForm.recipe]
                                          // Remove existing entry for this size
                                          newRec = newRec.filter((r: any) => !(r.ingredientId === ingId && r.sizeName === size.size_name))
                                          // Add new if > 0
                                          if (val > 0) {
                                            newRec.push({ ingredientId: ingId, sizeName: size.size_name, quantity: val })
                                          }
                                          setProdForm({ ...prodForm, recipe: newRec })
                                        }}
                                      />
                                      <span className="text-xs text-gray-500">g</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 text-right mt-1">{Math.round(cost).toLocaleString()} đ</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Add Ingredient Button */}
                    <div className="flex gap-2">
                      <select
                        className="border p-2 rounded flex-1 text-sm"
                        value={0}
                        onChange={(e) => {
                          const id = Number(e.target.value)
                          if (id === 0) return
                          // Check if already added
                          if (prodForm.recipe.find((r: any) => r.ingredientId === id)) return

                          // Add Init Entries for all sizes (0g)
                          const newRec = [...prodForm.recipe]
                          // Add default entry for first size
                          const firstSize = prodForm.sizes[0]?.size_name || 'M'
                          newRec.push({ ingredientId: id, sizeName: firstSize, quantity: 0 })

                          setProdForm({ ...prodForm, recipe: newRec })
                        }}
                      >
                        <option value={0}>+ Add Ingredient to Recipe</option>
                        {ingredients.filter((i: any) => !prodForm.recipe.find((r: any) => r.ingredientId === i.id)).map((i: any) => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="border-t border-blue-200 pt-2 text-right">
                    <div className="text-sm text-gray-600">Total Base Cost: <span className="font-bold text-gray-900">{Math.round(prodForm.recipe.reduce((total, r) => {
                      const ing = ingredients.find(i => i.id === r.ingredientId)
                      return total + (ing ? (ing.cost_per_gram * r.quantity) : 0)
                    }, 0)).toLocaleString()} VND</span></div>

                    <div className="text-xs text-gray-400 mt-1">
                      Est. Profit (Size M): <span className="font-bold text-green-600">
                        {(prodForm.sizes[0]?.price - prodForm.recipe.reduce((total, r) => {
                          const ing = ingredients.find(i => i.id === r.ingredientId)
                          return total + (ing ? (ing.cost_per_gram * r.quantity) : 0)
                        }, 0)).toLocaleString()} VND
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-2">
              <button onClick={() => setShowProdModal(false)} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-lg font-bold">Cancel</button>
              <button onClick={saveProduct} className="bg-matcha-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-matcha-700 shadow-lg">Save Product</button>
            </div>
          </div>
        </div>
      )}

      {/* Ingredient Modal */}
      {showIngModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded w-96 animate-scale-in shadow-xl">
            <h3 className="font-bold mb-4 text-xl">{editingId ? 'Edit' : 'New'} Ingredient</h3>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-400 mb-1">INGREDIENT NAME</label>
              <input className="border w-full p-2 rounded" placeholder="e.g. Matcha Powder Type A" value={ingForm.name} onChange={e => setIngForm({ ...ingForm, name: e.target.value })} />
            </div>

            {/* Calculator */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
              <label className="block text-xs font-bold text-blue-800 mb-2">COST CALCULATOR</label>
              <div className="flex gap-2 mb-2">
                <input type="number" className="flex-1 border p-2 rounded text-sm" placeholder="Price" value={calc.price || ''} onChange={e => setCalc({ ...calc, price: Number(e.target.value) })} />
                <select className="border p-2 rounded text-sm" value={calc.currency} onChange={e => setCalc({ ...calc, currency: Number(e.target.value) })}>
                  <option value={1}>VND</option>
                  <option value={25300}>USD ($)</option>
                </select>
              </div>
              <div className="flex gap-2 mb-2">
                <span className="text-xs flex items-center text-gray-500">per</span>
                <select className="flex-1 border p-2 rounded text-sm" value={calc.unit} onChange={e => setCalc({ ...calc, unit: e.target.value })}>
                  <option value="g">Gram (g)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="oz">Ounce (oz)</option>
                  <option value="lb">Pound (lb)</option>
                </select>
              </div>
              <button onClick={applyCalculator} className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded hover:bg-blue-700">Calculate & Set Cost</button>
            </div>

            {/* Manual Cost */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 mb-1">FINAL COST PER GRAM (VND)</label>
              <input type="number" className="border w-full p-2 rounded font-bold text-lg" value={ingForm.costPerGram} onChange={e => setIngForm({ ...ingForm, costPerGram: Number(e.target.value) })} />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowIngModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
              <button onClick={saveIngredient} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}