'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const C = {
  border: "#EAE0E0", accent: "#C41E3A", accentDim: "rgba(196,30,58,0.08)",
  text: "#1A1A2E", sub: "#555770", bg: "#FAF8F8", ok: "#0F9D58", warning: "#E67E22"
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<any[]>([])
  const [selectedEq, setSelectedEq] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'qs' | 'tips' | 'logs'>('qs')

  useEffect(() => { loadEquipment() }, [])

  const loadEquipment = async () => {
    const { data } = await supabase.from('equipment').select('*').order('name')
    if (data) setEquipment(data)
  }

  // 기기 상세 화면 (명세서 9-2)
  if (selectedEq) {
    return (
      <div className="p-8 max-w-4xl space-y-6">
        <button onClick={() => setSelectedEq(null)} className="text-sm font-semibold text-slate-500">← 기기 목록</button>
        
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded mb-2 inline-block"
                  style={{ background: selectedEq.status === 'Available' ? '#ECFDF5' : '#FFF7ED', color: selectedEq.status === 'Available' ? C.ok : C.warning }}>
              {selectedEq.status}
            </span>
            <h2 className="text-3xl font-bold">{selectedEq.name}</h2>
            <p className="text-slate-500 mt-1">{selectedEq.model} · {selectedEq.location} · 담당: {selectedEq.manager}</p>
          </div>
        </div>

        {/* 탭 메뉴 (명세서 9-2) */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          {[
            { id: 'qs', l: '매뉴얼' },
            { id: 'tips', l: '팁 & 트러블슈팅' },
            { id: 'logs', l: '사용 기록' }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === t.id ? 'bg-white shadow-sm text-[#C41E3A]' : 'text-slate-500'}`}>
              {t.l}
            </button>
          ))}
        </div>

        <div className="bg-white border rounded-2xl p-8 shadow-sm" style={{ borderColor: C.border }}>
          {activeTab === 'qs' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg mb-4">🚀 Quick Start</h3>
              {/* 실제 데이터가 없을 경우 명세서 샘플 표시 */}
              {[1, 2, 3, 4].map(num => (
                <div key={num} className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded bg-[#FFF5F5] text-[#C41E3A] flex items-center justify-center font-bold text-xs shrink-0">{num}</div>
                  <p className="text-sm text-slate-600 leading-relaxed">기기 전원을 켜고 소프트웨어를 초기화합니다. (상세 매뉴얼 참조)</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#FFF5F5] border border-[#C41E3A]/10">
                <h4 className="font-bold text-sm text-[#C41E3A] mb-2">💡 연구원 팁</h4>
                <p className="text-sm text-slate-600">✦ 사용 후 반드시 렌즈 페이퍼와 에탄올로 세척하십시오.</p>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-sm">🔧 트러블슈팅</h4>
                <div className="p-4 rounded-xl bg-slate-50 text-sm">
                  <p className="font-bold">⚠ 이미지 흐림 현상</p>
                  <p className="text-slate-500 mt-1">해결법: Objective 오염 확인 및 Oil 교체를 권장합니다.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="text-center py-10 text-slate-400 text-sm italic">최근 사용 기록이 없습니다.</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold">⚙️ 기기 관리</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {equipment.map(eq => (
          <div key={eq.id} onClick={() => setSelectedEq(eq)} 
               className="bg-white border rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all" style={{ borderColor: C.border }}>
            <span className="text-[10px] font-bold px-2 py-1 rounded mb-3 inline-block"
                  style={{ background: eq.status === 'Available' ? '#ECFDF5' : '#FFF7ED', color: eq.status === 'Available' ? C.ok : C.warning }}>
              {eq.status}
            </span>
            <h3 className="text-lg font-bold">{eq.name}</h3>
            <p className="text-xs text-slate-400 mt-1">{eq.model}</p>
            <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: C.border }}>
              <span className="text-[10px] font-bold text-blue-600 px-2 py-1 rounded bg-blue-50">📖 매뉴얼</span>
              <span className="text-[10px] text-slate-400">{eq.location}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}