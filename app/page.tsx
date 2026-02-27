'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// 디자인 프로토타입 색상표
const C = {
  bg: "#FAF8F8", border: "#EAE0E0", accent: "#C41E3A", accentDim: "rgba(196,30,58,0.08)",
  text: "#1A1A2E", sub: "#555770", muted: "#8E90A6", nav: "#C41E3A", navDim: "rgba(255,255,255,0.7)",
  ok: "#0F9D58", warning: "#E67E22", danger: "#C0392B"
}

export default function LabFlowDashboard() {
  const [reagents, setReagents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [tab, setTab] = useState<'all' | 'ongoing' | 'stock'>('all')
  
  // 폼 상태
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', brand: '', location: '', remaining: 100, isStock: false })

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('reagents').select('*').order('created_at', { ascending: false })
    if (data) setReagents(data)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // 필터링 적용 (검색 + Ongoing/Stock 탭)
  const filteredReagents = reagents.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (r.location && r.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (r.brand && r.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    
    // DB에 is_stock 컬럼이 없으므로 status나 잔량으로 임시 구분하거나, 향후 DB 업데이트 필요
    const isStock = r.status === 'stock' || r.remaining === 100
    
    if (tab === 'ongoing') return matchSearch && !isStock
    if (tab === 'stock') return matchSearch && isStock
    return matchSearch
  })

  const openModal = (r?: any) => {
    if (r) {
      setEditingId(r.id)
      setForm({ name: r.name, brand: r.brand || '', location: r.location || '', remaining: r.remaining, isStock: r.status === 'stock' })
    } else {
      setEditingId(null)
      setForm({ name: '', brand: '', location: '', remaining: 100, isStock: true })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return alert('시약 이름은 필수입니다.')

    const payload = { 
      name: form.name, brand: form.brand, location: form.location, remaining: form.remaining,
      status: form.isStock ? 'stock' : (form.remaining < 20 ? 'low' : 'ok')
    }

    const { error } = editingId 
      ? await supabase.from('reagents').update(payload).eq('id', editingId)
      : await supabase.from('reagents').insert([payload])

    if (error) alert('저장 실패: ' + error.message)
    else { setIsModalOpen(false); loadData() }
  }

  const handleScan = () => {
    alert('다음 단계에서 OCR(문자인식) 기능과 연결될 예정입니다. 카메라가 켜지고 라벨을 스캔합니다.')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg, fontFamily: "'Instrument Sans', sans-serif" }}>
      {/* 폰트 임포트 */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');`}</style>
      
      {/* 사이드바 */}
      <nav className="w-56 shrink-0 flex flex-col py-6 px-4" style={{ background: C.nav }}>
        <div className="flex items-center gap-3 pb-6 border-b border-white/20 mb-6">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-sm">K</div>
          <div>
            <div className="text-white text-sm font-bold">KIST Europe</div>
            <div className="text-xs mt-0.5" style={{ color: C.navDim }}>LabFlow</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button className="flex items-center gap-3 p-3 rounded-lg text-sm text-left w-full transition-all" style={{ background: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 600 }}>
            <span className="text-lg">🧪</span> 시약 관리
          </button>
          <button className="flex items-center gap-3 p-3 rounded-lg text-sm text-left w-full transition-all opacity-60 hover:bg-white/10" style={{ color: C.navDim }}>
            <span className="text-lg">⚙️</span> 기기 관리
          </button>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: C.text }}>시약 재고 관리</h2>
          <div className="flex gap-3">
            <button onClick={handleScan} className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2" style={{ background: "#fff", color: C.text, border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              📷 사진 스캔 등록
            </button>
            <button onClick={() => openModal()} className="px-4 py-2 rounded-lg text-white font-semibold" style={{ background: C.accent, boxShadow: `0 2px 8px ${C.accentDim}` }}>
              + 수동 등록
            </button>
          </div>
        </div>

        {/* 검색 및 탭 필터 */}
        <div className="flex gap-4 mb-6">
          <input 
            type="text" placeholder="🔍 시약 이름, 브랜드, 위치 검색..." 
            className="flex-1 max-w-md p-2.5 rounded-lg outline-none"
            style={{ border: `1px solid ${C.border}`, fontSize: 13, color: C.text }}
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex rounded-lg p-1" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
            {[
              { id: 'all', label: '전체' },
              { id: 'ongoing', label: '진행 중 (Ongoing)' },
              { id: 'stock', label: '재고 (Stock)' }
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)} className="px-4 py-1.5 rounded text-xs font-semibold"
                style={{ background: tab === t.id ? C.accentDim : 'transparent', color: tab === t.id ? C.accent : C.sub }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 시약 리스트 (디자인 프로토타입 스타일) */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="grid px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 80px", background: C.bg, color: C.muted }}>
            <span>시약 정보</span>
            <span>브랜드</span>
            <span>잔량</span>
            <span>위치</span>
            <span className="text-right">관리</span>
          </div>
          
          {loading ? <div className="p-8 text-center" style={{ color: C.muted }}>데이터 로딩 중...</div> : null}
          {!loading && filteredReagents.length === 0 ? <div className="p-8 text-center" style={{ color: C.muted }}>조건에 맞는 시약이 없습니다.</div> : null}
          
          {filteredReagents.map((r) => {
            const isStock = r.status === 'stock' || r.remaining === 100
            return (
              <div key={r.id} className="grid px-4 py-3 border-b items-center hover:bg-slate-50 transition-colors" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 80px", borderColor: C.border }}>
                <div>
                  <span className="block font-semibold" style={{ color: C.text, fontSize: 13 }}>{r.name}</span>
                  <span className="text-xs" style={{ color: C.muted }}>{isStock ? '📦 미개봉' : '🧪 사용 중'}</span>
                </div>
                <span style={{ color: C.sub, fontSize: 13 }}>{r.brand || '-'}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" 
                      style={{ 
                        width: `${Math.min(r.remaining, 100)}%`, 
                        background: r.remaining < 20 ? C.danger : C.accent 
                      }} />
                  </div>
                  <span className="text-xs" style={{ color: C.sub, fontFamily: "'Space Mono', monospace" }}>{r.remaining}%</span>
                </div>
                <span style={{ color: C.muted, fontSize: 12 }}>{r.location || '-'}</span>
                <div className="text-right">
                  <button onClick={() => openModal(r)} className="px-3 py-1.5 rounded-md text-xs font-semibold" style={{ border: `1px solid ${C.border}`, color: C.sub }}>
                    수정
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="rounded-2xl p-6 w-full max-w-md shadow-xl" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
              <h3 className="text-lg font-bold mb-5" style={{ color: C.text }}>{editingId ? '시약 정보 수정' : '새 시약 등록'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-4 p-1 rounded-lg mb-4" style={{ background: C.bg }}>
                  <label className="flex-1 text-center py-2 rounded-md cursor-pointer text-sm font-semibold transition-colors" style={{ background: !form.isStock ? '#fff' : 'transparent', color: !form.isStock ? C.text : C.sub, boxShadow: !form.isStock ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                    <input type="radio" className="hidden" checked={!form.isStock} onChange={() => setForm({...form, isStock: false})} /> 🧪 사용 중 (Ongoing)
                  </label>
                  <label className="flex-1 text-center py-2 rounded-md cursor-pointer text-sm font-semibold transition-colors" style={{ background: form.isStock ? '#fff' : 'transparent', color: form.isStock ? C.text : C.sub, boxShadow: form.isStock ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                    <input type="radio" className="hidden" checked={form.isStock} onChange={() => setForm({...form, isStock: true, remaining: 100})} /> 📦 새 시약 (Stock)
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: C.sub }}>시약 이름</label>
                  <input required className="w-full p-2.5 rounded-lg outline-none" style={{ border: `1px solid ${C.border}`, fontSize: 13 }} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: C.sub }}>제조사 (Brand)</label>
                  <input className="w-full p-2.5 rounded-lg outline-none" style={{ border: `1px solid ${C.border}`, fontSize: 13 }} value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: C.sub }}>보관 위치</label>
                  <input className="w-full p-2.5 rounded-lg outline-none" style={{ border: `1px solid ${C.border}`, fontSize: 13 }} value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
                {!form.isStock && (
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: C.sub }}>현재 잔량 (%)</label>
                    <input type="number" max="100" className="w-full p-2.5 rounded-lg outline-none" style={{ border: `1px solid ${C.border}`, fontSize: 13 }} value={form.remaining} onChange={e => setForm({...form, remaining: Number(e.target.value)})} />
                  </div>
                )}
                <div className="flex gap-3 pt-4 border-t mt-6" style={{ borderColor: C.border }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg font-semibold text-sm" style={{ background: C.bg, color: C.sub }}>취소</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm" style={{ background: C.accent }}>저장</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}