'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const C = {
  bg: "#FAF8F8", border: "#EAE0E0", accent: "#C41E3A", accentDim: "rgba(196,30,58,0.08)",
  text: "#1A1A2E", sub: "#555770", muted: "#8E90A6", nav: "#C41E3A", navDim: "rgba(255,255,255,0.7)",
  ok: "#0F9D58", warning: "#E67E22", danger: "#C0392B"
}

export default function LabFlowDashboard() {
  // --- 인증(Auth) 상태 ---
  const [session, setSession] = useState<any>(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  // --- 화면 전환 상태 ---
  const [activePage, setActivePage] = useState<'reagents' | 'protocols'>('reagents')

  // --- 시약 관리 상태 ---
  const [reagents, setReagents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [tab, setTab] = useState<'all' | 'ongoing' | 'stock'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', brand: '', location: '', remaining: 100, isStock: false })
  const [isScanning, setIsScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- 프로토콜 관리 상태 ---
  const [protocols, setProtocols] = useState<any[]>([])
  const [selectedProtocol, setSelectedProtocol] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  // 1. 세션(로그인 상태) 확인
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // 2. 데이터 로드 (로그인 된 상태에서만)
  useEffect(() => {
    if (!session) return
    if (activePage === 'reagents') loadReagents()
    if (activePage === 'protocols') loadProtocols()
  }, [activePage, session])

  // --- 인증 기능 ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword })
      if (error) alert('회원가입 실패: ' + error.message)
      else alert('회원가입 성공! 이제 로그인해 주세요.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
      if (error) alert('로그인 실패: 이메일이나 비밀번호를 확인해 주세요.')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // --- 시약 로드 ---
  const loadReagents = async () => {
    setLoading(true)
    const { data } = await supabase.from('reagents').select('*').order('created_at', { ascending: false })
    if (data) setReagents(data)
    setLoading(false)
  }

  // --- 프로토콜 로드 ---
  const loadProtocols = async () => {
    setLoading(true)
    const { data } = await supabase.from('protocols').select('*, protocol_steps(*)').order('created_at', { ascending: false })
    if (data) {
      data.forEach(p => p.protocol_steps.sort((a: any, b: any) => a.step_number - b.step_number))
      setProtocols(data)
    }
    setLoading(false)
  }

  // --- 시약 저장 로직 ---
  const handleReagentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return
    const payload = { 
      name: form.name, brand: form.brand, location: form.location, remaining: form.remaining,
      status: form.isStock ? 'stock' : (form.remaining < 20 ? 'low' : 'ok')
    }
    const { error } = editingId 
      ? await supabase.from('reagents').update(payload).eq('id', editingId)
      : await supabase.from('reagents').insert([payload])
    if (!error) { setIsModalOpen(false); loadReagents() }
  }

  // --- 파일 스캔 로직 (Mock) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsScanning(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setForm({ name: 'Phosphate-Buffered Saline (PBS)', brand: 'Gibco', location: '', remaining: 100, isStock: true })
    setEditingId(null)
    setIsModalOpen(true)
    setIsScanning(false)
  }

  // --- 데모 프로토콜 삽입 ---
  const insertDemoProtocol = async () => {
    const { data: proto, error } = await supabase.from('protocols').insert({
      title: 'Western Blot — Sample Prep', category: 'Protein', source: 'KIST Europe Standard', difficulty: 'Beginner', time_estimate: '1h'
    }).select().single()
    if (error) return alert('생성 실패')

    await supabase.from('protocol_steps').insert([
      { protocol_id: proto.id, step_number: 1, title: 'Lysis Buffer 준비', description: 'RIPA buffer에 Protease Inhibitor 추가', time_estimate: '5 min', reagents: ['RIPA', 'PI'] },
      { protocol_id: proto.id, step_number: 2, title: 'Cell Lysis', description: '4°C에서 30분간 반응', time_estimate: '30 min', reagents: [] }
    ])
    loadProtocols()
  }

  // ==========================================
  // 1. 비로그인 상태 화면 (로그인/회원가입 창)
  // ==========================================
  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: C.bg, fontFamily: "'Instrument Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');`}</style>
        <div className="p-10 rounded-2xl w-full max-w-sm shadow-xl" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl" style={{ background: C.accent }}>K</div>
            <h1 className="text-2xl font-bold" style={{ color: C.text }}>LabFlow</h1>
            <p className="text-sm mt-1" style={{ color: C.muted }}>KIST Europe 연구실 인벤토리</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: C.sub }}>이메일 주소</label>
              <input type="email" required className="w-full p-3 rounded-lg outline-none" style={{ border: `1px solid ${C.border}`, fontSize: 14 }} value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="researcher@kist-europe.de" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: C.sub }}>비밀번호</label>
              <input type="password" required className="w-full p-3 rounded-lg outline-none" style={{ border: `1px solid ${C.border}`, fontSize: 14 }} value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full py-3 rounded-lg text-white font-bold mt-2 transition-opacity hover:opacity-90" style={{ background: C.accent }}>
              {isSignUp ? '계정 생성하기' : '로그인'}
            </button>
          </form>
          <div className="text-center mt-6">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-semibold hover:underline" style={{ color: C.sub }}>
              {isSignUp ? '이미 계정이 있으신가요? 로그인' : '처음이신가요? 연구원 등록'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // 2. 로그인 완료 상태 화면 (메인 대시보드)
  // ==========================================
  const filteredReagents = reagents.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || (r.location && r.location.toLowerCase().includes(searchQuery.toLowerCase())) || (r.brand && r.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    const isStock = r.status === 'stock' || r.remaining === 100
    if (tab === 'ongoing') return matchSearch && !isStock
    if (tab === 'stock') return matchSearch && isStock
    return matchSearch
  })

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg, fontFamily: "'Instrument Sans', sans-serif" }}>
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {/* 사이드바 */}
      <nav className="w-56 shrink-0 flex flex-col py-6 px-4" style={{ background: C.nav }}>
        <div className="flex items-center gap-3 pb-6 border-b border-white/20 mb-6">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-sm">K</div>
          <div><div className="text-white text-sm font-bold">KIST Europe</div><div className="text-xs mt-0.5" style={{ color: C.navDim }}>LabFlow</div></div>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <button onClick={() => { setActivePage('reagents'); setSelectedProtocol(null); }} className="flex items-center gap-3 p-3 rounded-lg text-sm text-left w-full transition-all" style={{ background: activePage === 'reagents' ? "rgba(255,255,255,0.25)" : "transparent", color: activePage === 'reagents' ? "#fff" : C.navDim, fontWeight: activePage === 'reagents' ? 600 : 400 }}>
            <span className="text-lg">🧪</span> 시약 관리
          </button>
          <button onClick={() => { setActivePage('protocols'); setSelectedProtocol(null); }} className="flex items-center gap-3 p-3 rounded-lg text-sm text-left w-full transition-all" style={{ background: activePage === 'protocols' ? "rgba(255,255,255,0.25)" : "transparent", color: activePage === 'protocols' ? "#fff" : C.navDim, fontWeight: activePage === 'protocols' ? 600 : 400 }}>
            <span className="text-lg">📋</span> 프로토콜
          </button>
        </div>
        
        {/* 하단 유저 정보 및 로그아웃 버튼 */}
        <div className="pt-4 border-t border-white/20 mt-auto">
          <div className="text-xs text-white/70 truncate mb-3 px-2">{session.user.email}</div>
          <button onClick={handleLogout} className="w-full py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors">
            로그아웃
          </button>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto p-8">
        
        {/* 1. 시약 관리 화면 */}
        {activePage === 'reagents' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: C.text }}>시약 재고 관리</h2>
              <div className="flex gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2" style={{ background: "#fff", color: C.text, border: `1px solid ${C.border}` }}>
                  {isScanning ? '⏳ 대기...' : '📷 스캔 등록'}
                </button>
                <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="px-4 py-2 rounded-lg text-white font-semibold" style={{ background: C.accent }}>+ 수동 등록</button>
              </div>
            </div>
            
            <div className="flex gap-4 mb-6">
              <input type="text" placeholder="🔍 시약 검색..." className="flex-1 max-w-md p-2.5 rounded-lg outline-none" style={{ border: `1px solid ${C.border}`, fontSize: 13, color: C.text }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <div className="flex rounded-lg p-1" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                {[{ id: 'all', label: '전체' }, { id: 'ongoing', label: '진행 중' }, { id: 'stock', label: '재고' }].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id as any)} className="px-4 py-1.5 rounded text-xs font-semibold" style={{ background: tab === t.id ? C.accentDim : 'transparent', color: tab === t.id ? C.accent : C.sub }}>{t.label}</button>
                ))}
              </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
               <div className="grid px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr", background: C.bg, color: C.muted }}>
                <span>시약 정보</span><span>브랜드</span><span>잔량</span><span>위치</span>
              </div>
              {filteredReagents.map((r) => (
                <div key={r.id} className="grid px-4 py-3 border-b items-center" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr", borderColor: C.border }}>
                  <span className="font-semibold text-sm">{r.name}</span>
                  <span className="text-sm text-slate-500">{r.brand || '-'}</span>
                  <span className="text-sm">{r.remaining}%</span>
                  <span className="text-sm text-slate-500">{r.location || '-'}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 2. 프로토콜 화면 */}
        {activePage === 'protocols' && !selectedProtocol && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: C.text }}>프로토콜 라이브러리</h2>
              <button onClick={insertDemoProtocol} className="px-4 py-2 rounded-lg text-white font-semibold" style={{ background: C.accent }}>+ 데모 생성</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {protocols.map(p => (
                <div key={p.id} onClick={() => setSelectedProtocol(p)} className="p-5 rounded-xl cursor-pointer hover:-translate-y-1 transition-transform" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                  <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 mb-2 inline-block">{p.category || '미분류'}</span>
                  <h3 className="font-bold text-lg mb-1">{p.title}</h3>
                  <p className="text-sm text-slate-500">{p.protocol_steps?.length || 0} 단계 · 예상 시간: {p.time_estimate}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 프로토콜 상세 */}
        {activePage === 'protocols' && selectedProtocol && (
          <div className="max-w-3xl">
            <button onClick={() => setSelectedProtocol(null)} className="text-sm font-semibold mb-4" style={{ color: C.sub }}>← 목록으로</button>
            <h2 className="text-3xl font-bold mb-6">{selectedProtocol.title}</h2>
            <div className="space-y-4">
              {selectedProtocol.protocol_steps?.map((step: any) => (
                <div key={step.id} className="p-5 rounded-xl flex gap-4" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                  <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-sm" style={{ background: C.accentDim, color: C.accent }}>{step.step_number}</div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">{step.title}</h4>
                    <p className="text-slate-600 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="rounded-2xl p-6 w-full max-w-md bg-white">
              <h3 className="text-lg font-bold mb-5">시약 등록</h3>
              <form onSubmit={handleReagentSubmit} className="space-y-4">
                <input required className="w-full p-2 border rounded" placeholder="이름" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded">취소</button>
                  <button type="submit" className="flex-1 py-2 text-white rounded" style={{ background: C.accent }}>저장</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}