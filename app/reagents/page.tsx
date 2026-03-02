'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const C = {
  bg: "#FAF8F8", border: "#EAE0E0", accent: "#C41E3A", accentDim: "rgba(196,30,58,0.08)",
  text: "#1A1A2E", sub: "#555770", muted: "#8E90A6",
  ok: "#0F9D58", warning: "#E67E22", danger: "#C0392B", info: "#2C6FBB", infoDim: "rgba(44,111,187,0.1)"
}

export default function ReagentsPage() {
  const [reagents, setReagents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'ongoing' | 'stock'>('ongoing')
  
  const [isRegModalOpen, setIsRegModalOpen] = useState(false)
  const [isOrderEditModalOpen, setIsOrderEditModalOpen] = useState(false)
  const [selectedReagent, setSelectedReagent] = useState<any>(null)

  const [regForm, setRegForm] = useState({ name: '', brand: '', cat: '', loc: '', rem: 100, is_stock: true, expiry: '', opened: '', temp: '' })
  const [orderForm, setOrderForm] = useState({ type: 'email', url: '', con: '' })

  useEffect(() => { loadReagents() }, [])

  const loadReagents = async () => {
    setLoading(true)
    const { data } = await supabase.from('reagents').select('*').order('created_at', { ascending: false })
    if (data) setReagents(data)
    setLoading(false)
  }

  const updateReagent = async (id: string, updates: any) => {
    const { error } = await supabase.from('reagents').update(updates).eq('id', id)
    if (!error) loadReagents()
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`'${name}' 시약을 삭제하시겠습니까?`)) {
      const { error } = await supabase.from('reagents').delete().eq('id', id)
      if (!error) loadReagents()
    }
  }

  const handleUpdateOrder = async () => {
    const { error } = await supabase.from('reagents').update({
      order_type: orderForm.type, order_url: orderForm.url, order_contact: orderForm.con
    }).eq('id', selectedReagent.id)
    if (!error) { setIsOrderEditModalOpen(false); loadReagents(); }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('reagents').insert([{
      name: regForm.name, brand: regForm.brand, catalog_number: regForm.cat,
      location: regForm.loc, remaining: regForm.rem, is_stock: regForm.is_stock,
      expiry_date: regForm.expiry, opened_at: regForm.opened || null,
      storage_temp: regForm.temp,
      status: 'ok'
    }])
    if (!error) { setIsRegModalOpen(false); loadReagents(); }
  }

  const filtered = reagents.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesView = view === 'stock' ? r.is_stock : !r.is_stock
    return matchesSearch && matchesView
  })

  return (
    <div className="p-8 space-y-6" style={{ background: C.bg, fontFamily: "'Instrument Sans', sans-serif" }}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: C.text }}>🧪 시약 관리</h2>
        <button onClick={() => setIsRegModalOpen(true)} className="px-4 py-2 rounded-lg text-white font-bold shadow-md hover:opacity-90" style={{ background: C.accent }}>+ 시약 등록</button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          <button onClick={() => setView('ongoing')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'ongoing' ? 'bg-white shadow-sm text-[#C41E3A]' : 'text-slate-500'}`}>Ongoing (사용 중)</button>
          <button onClick={() => setView('stock')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'stock' ? 'bg-white shadow-sm text-[#C41E3A]' : 'text-slate-500'}`}>Stock (재고)</button>
        </div>
        <input placeholder="🔍 검색..." className="w-full max-w-xs p-2.5 rounded-xl border outline-none text-sm shadow-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      <div className="rounded-xl overflow-hidden bg-white border shadow-sm" style={{ borderColor: C.border }}>
        <div className="grid px-4 py-3 text-[10px] font-bold uppercase tracking-wider bg-[#FAF8F8] border-b" 
             style={{ gridTemplateColumns: view === 'ongoing' ? "2fr 1fr 80px 80px 80px 100px 1fr 80px 40px" : "2fr 1fr 80px 100px 1fr 80px 40px", color: C.muted }}>
          <span>시약 정보</span><span>브랜드</span>
          {view === 'ongoing' && <span>잔량</span>}
          <span>보관온도</span>
          {view === 'ongoing' && <span>개봉일</span>}
          <span>유통기한</span><span>위치</span><span>주문</span><span></span>
        </div>
        
        {loading ? <div className="p-10 text-center text-sm text-slate-400">로딩 중...</div> : filtered.map(r => (
          <div key={r.id} className="grid px-4 py-4 border-b items-center text-sm hover:bg-[#FFF5F5]/30 transition-colors" 
               style={{ gridTemplateColumns: view === 'ongoing' ? "2fr 1fr 80px 80px 80px 100px 1fr 80px 40px" : "2fr 1fr 80px 100px 1fr 80px 40px", borderColor: C.border }}>
            <div className="flex flex-col"><span className="font-bold">{r.name}</span><span className="text-[10px] font-mono text-[#8E90A6]">{r.catalog_number}</span></div>
            <span className="truncate pr-2">{r.brand}</span>
            {view === 'ongoing' && (
              <input type="number" className="w-14 p-1 border rounded font-mono text-xs outline-none" value={r.remaining} 
                     onChange={e => updateReagent(r.id, { remaining: parseInt(e.target.value) || 0 })} />
            )}
            <span className="text-xs font-semibold" style={{ color: r.storage_temp?.includes('-') ? C.info : C.text }}>{r.storage_temp || '-'}</span>
            {view === 'ongoing' && <span className="text-xs text-slate-500">{r.opened_at || '-'}</span>}
            <span className={`text-xs ${new Date(r.expiry_date) < new Date() ? 'text-red-500 font-bold' : ''}`}>{r.expiry_date || '-'}</span>
            <span className="text-[#8E90A6] text-[11px] truncate">{r.location}</span>
            <button onClick={() => {
              if (r.order_type) {
                if (r.order_type === 'email') window.open(`mailto:${r.order_url}?subject=[Order] ${r.name}`);
                else window.open(r.order_url, '_blank');
              } else {
                setSelectedReagent(r); setIsOrderEditModalOpen(true);
              }
            }} className="px-2 py-1 rounded text-[10px] font-bold transition-all shadow-sm"
               style={{ background: r.order_type ? (r.order_type === 'email' ? C.infoDim : C.accentDim) : 'transparent', color: r.order_type ? (r.order_type === 'email' ? C.info : C.accent) : C.muted, border: r.order_type ? 'none' : '1px dashed #EAE0E0' }}>
              {r.order_type === 'email' ? '✉ 메일' : '🌐 사이트'}
            </button>
            <button onClick={() => handleDelete(r.id, r.name)} className="text-slate-300 hover:text-red-500 text-lg text-center transition-colors">✕</button>
          </div>
        ))}
      </div>

      {isRegModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">🧪 새 시약 등록</h3>
            <form onSubmit={handleRegister} className="space-y-3">
              <input required placeholder="시약 이름 *" className="w-full p-2 border rounded-lg outline-none" onChange={e => setRegForm({...regForm, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="제조사" className="p-2 border rounded-lg outline-none" onChange={e => setRegForm({...regForm, brand: e.target.value})} />
                <input placeholder="Cat#" className="p-2 border rounded-lg outline-none font-mono text-sm" onChange={e => setRegForm({...regForm, cat: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="보관 온도" className="p-2 border rounded-lg outline-none text-sm" onChange={e => setRegForm({...regForm, temp: e.target.value})} />
                <input placeholder="보관 위치" className="p-2 border rounded-lg outline-none text-sm" onChange={e => setRegForm({...regForm, loc: e.target.value})} />
              </div>
              <div className="text-xs">
                <label className="block mb-1 text-slate-500">유통기한</label>
                <input type="date" className="w-full p-2 border rounded-lg outline-none" onChange={e => setRegForm({...regForm, expiry: e.target.value})} />
              </div>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <input type="checkbox" checked={!regForm.is_stock} onChange={e => setRegForm({...regForm, is_stock: !e.target.checked, opened: e.target.checked ? new Date().toISOString().split('T')[0] : ''})} className="w-4 h-4 accent-[#C41E3A]" />
                <span className="text-xs font-bold text-slate-600">등록 즉시 개봉 (Ongoing)</span>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsRegModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold text-slate-600">취소</button>
                <button type="submit" className="flex-1 py-2.5 text-white rounded-xl font-bold shadow-lg" style={{ background: C.accent }}>저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isOrderEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">🔗 주문처 연결 — {selectedReagent?.name}</h3>
            <div className="flex gap-2 mb-4">
              {[['email', '✉ 이메일'], ['site', '🌐 사이트']].map(([v, l]) => (
                <button key={v} onClick={() => setOrderForm({...orderForm, type: v})}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${orderForm.type === v ? 'border-[#C41E3A] bg-[#FFF5F5] text-[#C41E3A]' : 'border-[#EAE0E0] text-slate-400'}`}>
                  {l}
                </button>
              ))}
            </div>
            <input placeholder={orderForm.type === 'email' ? "주문 이메일 주소" : "공식 사이트 URL"} className="w-full p-2 border rounded-lg mb-4 outline-none text-sm" value={orderForm.url} onChange={e => setOrderForm({...orderForm, url: e.target.value})} />
            <div className="flex gap-2">
              <button onClick={() => setIsOrderEditModalOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600">닫기</button>
              <button onClick={handleUpdateOrder} className="flex-[2] py-3 text-white rounded-xl font-bold shadow-md" style={{ background: C.accent }}>정보 저장하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}