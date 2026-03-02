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
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReagents()
  }, [])

  const loadReagents = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reagents')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setReagents(data)
    setLoading(false)
  }

  // 명세서 8-5: 주문 처리 로직
  const handleOrder = (r: any) => {
    if (r.order_type === 'email') {
      const subject = encodeURIComponent(`[Order] ${r.name} (Cat# ${r.catalog_number || 'N/A'})`)
      window.open(`mailto:${r.order_url}?subject=${subject}`)
    } else if (r.order_type === 'site') {
      window.open(r.order_url, '_blank')
    } else {
      alert('주문처 정보가 등록되지 않았습니다.')
    }
  }

  const filteredReagents = reagents.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.brand && r.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: C.text }}>🧪 시약 재고 관리</h2>
        <button className="px-4 py-2 rounded-lg text-white font-semibold shadow-md" style={{ background: C.accent }}>
          + 시약 등록
        </button>
      </div>

      {/* 검색 바 */}
      <input 
        type="text" 
        placeholder="🔍 시약 검색 (이름, 브랜드)..." 
        className="w-full max-w-md p-3 rounded-xl border outline-none focus:ring-2"
        style={{ borderColor: C.border, fontSize: '13px' }}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* 시약 테이블 */}
      <div className="rounded-xl overflow-hidden bg-white border shadow-sm" style={{ borderColor: C.border }}>
        <div className="grid px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-b" 
             style={{ gridTemplateColumns: "2fr 1fr 70px 80px 1fr 50px 80px", background: C.bg, color: C.muted }}>
          <span>시약</span><span>브랜드</span><span>잔량</span><span>유통기한</span><span>위치</span><span>상태</span><span>주문</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">데이터 로딩 중...</div>
        ) : filteredReagents.map((r) => (
          <div key={r.id} className="grid px-4 py-4 border-b items-center hover:bg-[#FFF5F5] transition-colors" 
               style={{ gridTemplateColumns: "2fr 1fr 70px 80px 1fr 50px 80px", borderColor: C.border }}>
            <div className="flex flex-col">
              <span className="font-bold text-[12px]" style={{ color: C.text }}>{r.name}</span>
              <span className="text-[10px] font-mono" style={{ color: C.muted }}>{r.catalog_number || '-'}</span>
            </div>
            <span className="text-[12px]" style={{ color: C.sub }}>{r.brand || '-'}</span>
            <span className="text-[12px] font-mono">{r.remaining}%</span>
            <span className="text-[12px]" style={{ color: r.status === 'expiring' ? C.danger : C.sub }}>{r.expiry_date || '-'}</span>
            <span className="text-[11px]" style={{ color: C.muted }}>{r.location || '-'}</span>
            
            {/* 상태 도트 */}
            <div className="flex justify-center">
              <div className="w-2 h-2 rounded-full" style={{ 
                background: r.status === 'ok' ? C.ok : r.status === 'low' ? C.warning : C.danger 
              }} />
            </div>

            {/* 주문 버튼 */}
            <button 
              onClick={() => handleOrder(r)}
              className="px-2 py-1 rounded text-[10px] font-bold transition-opacity hover:opacity-80"
              style={{ 
                background: r.order_type === 'email' ? C.infoDim : C.accentDim,
                color: r.order_type === 'email' ? C.info : C.accent
              }}
            >
              {r.order_type === 'email' ? '✉ 메일' : r.order_type === 'site' ? '🌐 사이트' : '+ 등록'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}