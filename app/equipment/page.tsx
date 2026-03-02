'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const C = {
  border: "#EAE0E0", accent: "#C41E3A", accentDim: "rgba(196,30,58,0.08)",
  text: "#1A1A2E", sub: "#555770", bg: "#FAF8F8", ok: "#0F9D58", warning: "#E67E22"
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEquipment()
  }, [])

  const loadEquipment = async () => {
    setLoading(true)
    // Supabase에서 기기 목록 가져오기
    const { data, error } = await supabase.from('equipment').select('*').order('name')
    if (data) setEquipment(data)
    setLoading(false)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold" style={{ color: C.text }}>⚙️ 기기 관리 및 예약</h2>
        <button 
          onClick={() => alert('기기 등록 기능은 관리자 권한이 필요합니다.')}
          className="px-4 py-2 rounded-lg text-white font-semibold" 
          style={{ background: C.accent }}
        >
          + 새 기기 등록
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">장비 목록을 불러오는 중...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map((eq) => (
            <div key={eq.id} className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: C.border }}>
              <div className="flex justify-between items-start mb-4">
                <span 
                  className="text-[10px] font-bold uppercase px-2 py-1 rounded"
                  style={{ 
                    background: eq.status === 'Available' ? '#ECFDF5' : '#FFF7ED', 
                    color: eq.status === 'Available' ? C.ok : C.warning 
                  }}
                >
                  {eq.status}
                </span>
                <span className="text-xs text-slate-400">{eq.location}</span>
              </div>
              
              <h3 className="text-lg font-bold mb-1" style={{ color: C.text }}>{eq.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{eq.model}</p>
              
              <div className="pt-4 border-t flex justify-between items-center" style={{ borderColor: C.border }}>
                <span className="text-xs text-slate-400">담당자: {eq.manager || '미정'}</span>
                <button 
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border hover:bg-slate-50 transition-colors"
                  style={{ color: C.sub, borderColor: C.border }}
                >
                  매뉴얼 보기
                </button>
              </div>
            </div>
          ))}
          
          {equipment.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl" style={{ borderColor: C.border }}>
              <p className="text-slate-400">등록된 장비가 없습니다. SQL Editor에서 데이터를 추가해 주세요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}