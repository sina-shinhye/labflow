'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LabFlowDashboard() {
  const [reagents, setReagents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // 새 시약 입력을 위한 상태
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBrand, setNewBrand] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newRemaining, setNewRemaining] = useState(100)

  // 1. 데이터 불러오기 (Read)
  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('reagents').select('*').order('created_at', { ascending: false })
    if (data) setReagents(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // 2. 시약 추가하기 (Create)
  const handleAddReagent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName) return alert('시약 이름은 필수입니다.')

    const { error } = await supabase.from('reagents').insert([
      { 
        name: newName, 
        brand: newBrand, 
        location: newLocation, 
        remaining: newRemaining,
        status: newRemaining < 20 ? 'low' : 'ok'
      }
    ])

    if (error) {
      alert('저장 실패: ' + error.message)
    } else {
      setIsModalOpen(false)
      setNewName(''); setNewBrand(''); setNewLocation(''); setNewRemaining(100);
      loadData() // 목록 새로고침
    }
  }

  // 3. 시약 삭제하기 (Delete)
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const { error } = await supabase.from('reagents').delete().eq('id', id)
    if (error) alert('삭제 실패')
    else loadData()
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 사이드바 (생략 가능, 기존과 동일) */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
        <h1 className="text-2xl font-bold mb-8 text-blue-400 italic">LabFlow</h1>
        <nav className="space-y-4">
          <div className="flex items-center space-x-2 p-2 bg-blue-600 rounded"><span>🧪 시약 관리</span></div>
          <div className="flex items-center space-x-2 p-2 hover:bg-slate-800 rounded opacity-50"><span>📅 장비 예약</span></div>
          <div className="flex items-center space-x-2 p-2 hover:bg-slate-800 rounded opacity-50"><span>📝 실험 노트</span></div>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">인벤토리 대시보드</h2>
            <p className="text-slate-500">실시간 시약 재고를 관리하세요.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-lg transition"
          >
            + 새 시약 등록
          </button>
        </header>

        {/* 시약 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <p>로딩 중...</p>
          ) : (
            reagents.map((r) => (
              <div key={r.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm group">
                <div className="flex justify-between mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${r.remaining < 20 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {r.remaining < 20 ? '재고 부족' : '정상'}
                  </span>
                  <button onClick={() => handleDelete(r.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">삭제</button>
                </div>
                <h3 className="text-xl font-bold mb-1">{r.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{r.brand || '제조사 미정'}</p>
                <div className="w-full bg-slate-100 h-2 rounded-full mb-2">
                  <div className={`h-full rounded-full ${r.remaining < 20 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${r.remaining}%` }}></div>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>잔량: {r.remaining}%</span>
                  <span>📍 {r.location || '위치 미정'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 시약 추가 모달 (팝업창) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-2xl font-bold mb-6">새 시약 등록</h3>
              <form onSubmit={handleAddReagent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">시약 이름 *</label>
                  <input required className="w-full p-2 border rounded-lg" value={newName} onChange={e => setNewName(e.target.value)} placeholder="예: TRIzol" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">제조사</label>
                  <input className="w-full p-2 border rounded-lg" value={newBrand} onChange={e => setNewBrand(e.target.value)} placeholder="예: Invitrogen" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">보관 위치</label>
                  <input className="w-full p-2 border rounded-lg" value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="예: 냉장고 A-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">현재 잔량 (%)</label>
                  <input type="number" className="w-full p-2 border rounded-lg" value={newRemaining} onChange={e => setNewRemaining(Number(e.target.value))} />
                </div>
                <div className="flex space-x-3 mt-8">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl">취소</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">저장하기</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}