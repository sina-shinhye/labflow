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
      <h2 className="text-2xl font-bold" style={{ color: C.text }}>📈 실험 관리</h2>
      {exps.map(e => (
        <div key={e.id} className="bg-white border rounded-2xl p-6 shadow-sm transition-transform hover:-translate-y-1" style={{ borderColor: C.border }}>
          <div className="flex gap-2 mb-3 items-center">
            <span className="text-[10px] font-bold px-2 py-1 rounded" style={{ 
              background: e.status === '완료' ? '#ECFDF5' : '#FFF5F5', 
              color: e.status === '완료' ? C.ok : C.accent 
            }}>{e.status}</span>
            <span className="text-xs text-slate-400">{e.date_range}</span>
          </div>
          <h3 className="text-lg font-bold mb-2">{e.title}</h3>
          <p className="text-sm text-slate-500 mb-4">{e.notes}</p>
          <div className="flex gap-2 mb-4">
            {e.protocols?.map((p: string, i: number) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-md" style={{ background: '#F3E8FF', color: C.purple }}>{p}</span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full transition-all" style={{ width: `${e.progress}%`, background: e.status === '완료' ? C.ok : C.accent }} />
            </div>
            <span className="text-xs font-mono">{e.progress}%</span>
          </div>
        </div>
      ))}
    </div>
  )
}