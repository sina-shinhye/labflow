'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const C = {
  border: "#EAE0E0", accent: "#C41E3A", ok: "#0F9D58", info: "#2C6FBB",
  text: "#1A1A2E", sub: "#555770", bg: "#FAF8F8", purple: "#7C3AED"
}

export default function ExperimentsPage() {
  const [exps, setExps] = useState<any[]>([])

  useEffect(() => {
    const loadExps = async () => {
      const { data } = await supabase.from('experiments').select('*').order('created_at', { ascending: false })
      if (data) setExps(data)
    }
    loadExps()
  }, [])

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold" style={{ color: C.text }}>📈 실험 관리</h2>
        <button className="px-4 py-2 rounded-lg text-white font-semibold" style={{ background: C.accent }}>+ 새 실험 계획</button>
      </div>

      <div className="space-y-4">
        {exps.map(e => (
          <div key={e.id} className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all" style={{ borderColor: C.border }}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-2 items-center">
                {/* 상태별 배지 색상 적용 (명세서 10-1) */}
                <span className="text-[10px] font-bold px-2 py-1 rounded uppercase" style={{ 
                  background: e.status === '완료' ? '#ECFDF5' : e.status === '계획' ? '#EFF6FF' : '#FFF5F5', 
                  color: e.status === '완료' ? C.ok : e.status === '계획' ? C.info : C.accent 
                }}>{e.status}</span>
                <span className="text-[11px] text-slate-400 font-mono">{e.date_range}</span>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-2">{e.title}</h3>
            <p className="text-sm text-slate-500 mb-4">{e.notes}</p>

            {/* 관련 프로토콜 태그 (명세서 10-1) */}
            <div className="flex gap-2 mb-6">
              {e.protocols?.map((p: string, i: number) => (
                <span key={i} className="text-[10px] font-bold px-2 py-1 rounded bg-[#F3E8FF] text-[#7C3AED]">{p}</span>
              ))}
            </div>

            {/* 진행률 바 (명세서 10-1) */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Progress</span>
                <span className="text-xs font-bold font-mono" style={{ color: e.status === '완료' ? C.ok : C.accent }}>{e.progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-500" 
                     style={{ width: `${e.progress}%`, background: e.status === '완료' ? C.ok : C.accent }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}