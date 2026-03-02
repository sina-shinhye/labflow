'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const C = {
  border: "#EAE0E0", accent: "#C41E3A", accentDim: "rgba(196,30,58,0.08)",
  text: "#1A1A2E", sub: "#555770", muted: "#8E90A6", bg: "#FAF8F8", danger: "#C0392B"
}

export default function ReagentsPage() {
  const [reagents, setReagents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', brand: '', location: '', remaining: 100, isStock: true })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadReagents() }, [])

  const loadReagents = async () => {
    setLoading(false)
    const { data } = await supabase.from('reagents').select('*').order('created_at', { ascending: false })
    if (data) setReagents(data)
  }

  const handleReagentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { 
      name: form.name, brand: form.brand, location: form.location, remaining: form.remaining,
      status: form.isStock ? 'stock' : (form.remaining < 20 ? 'low' : 'ok')
    }
    await supabase.from('reagents').insert([payload])
    setIsModalOpen(false)
    loadReagents()
  }

  return (
    <div className="p-8">
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" 
        onChange={() => alert('스캔 기능이 작동합니다 (Mock)')} />
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold" style={{ color: C.text }}>🧪 시약 재고 관리</h2>
        <div className="flex gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg font-semibold border bg-white">📷 스캔 등록</button>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 rounded-lg text-white font-semibold" style={{ background: C.accent }}>+ 수동 등록</button>
        </div>
      </div>

      <input type="text" placeholder="🔍 시약 검색..." className="w-full max-w-md p-2.5 rounded-lg border mb-6 outline-none" 
        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />

      <div className="rounded-xl overflow-hidden bg-white border" style={{ borderColor: C.border }}>
        <div className="grid px-4 py-3 text-xs font-bold uppercase" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr", background: C.bg, color: C.muted }}>
          <span>시약 정보</span><span>브랜드</span><span>잔량</span><span>위치</span>
        </div>
        {reagents.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).map((r) => (
          <div key={r.id} className="grid px-4 py-3 border-b items-center text-sm" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr", borderColor: C.border }}>
            <span className="font-semibold">{r.name}</span>
            <span className="text-slate-500">{r.brand || '-'}</span>
            <span>{r.remaining}%</span>
            <span className="text-slate-500">{r.location || '-'}</span>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl p-6 w-full max-w-md bg-white">
            <h3 className="text-lg font-bold mb-5">새 시약 등록</h3>
            <form onSubmit={handleReagentSubmit} className="space-y-4">
              <input required className="w-full p-2 border rounded" placeholder="이름" onChange={e => setForm({...form, name: e.target.value})} />
              <input className="w-full p-2 border rounded" placeholder="제조사" onChange={e => setForm({...form, brand: e.target.value})} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded">취소</button>
                <button type="submit" className="flex-1 py-2 text-white rounded" style={{ background: C.accent }}>저자</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}