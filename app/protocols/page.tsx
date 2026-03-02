'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const C = {
  border: "#EAE0E0", accent: "#C41E3A", accentDim: "rgba(196,30,58,0.08)",
  text: "#1A1A2E", sub: "#555770", bg: "#FAF8F8"
}

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<any[]>([])
  const [selectedProtocol, setSelectedProtocol] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadProtocols() }, [])

  const loadProtocols = async () => {
    const { data } = await supabase.from('protocols').select('*, protocol_steps(*)')
    if (data) setProtocols(data)
    setLoading(false)
  }

  if (selectedProtocol) {
    return (
      <div className="p-8 max-w-3xl">
        <button onClick={() => setSelectedProtocol(null)} className="text-sm font-semibold mb-4 text-slate-500">← 목록으로 돌아가기</button>
        <h2 className="text-3xl font-bold mb-6">{selectedProtocol.title}</h2>
        <div className="space-y-4">
          {selectedProtocol.protocol_steps?.sort((a:any, b:any) => a.step_number - b.step_number).map((step: any) => (
            <div key={step.id} className="p-5 rounded-xl flex gap-4 bg-white border" style={{ borderColor: C.border }}>
              <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-sm" style={{ background: C.accentDim, color: C.accent }}>{step.step_number}</div>
              <div>
                <h4 className="font-bold text-lg mb-1">{step.title}</h4>
                <p className="text-slate-600 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold" style={{ color: C.text }}>📋 프로토콜 라이브러리</h2>
        <button onClick={() => alert('데모 생성 기능')} className="px-4 py-2 rounded-lg text-white font-semibold" style={{ background: C.accent }}>+ 새 프로토콜</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {protocols.map(p => (
          <div key={p.id} onClick={() => setSelectedProtocol(p)} className="p-5 rounded-xl bg-white border cursor-pointer hover:shadow-md transition-shadow">
            <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 mb-2 inline-block">{p.category}</span>
            <h3 className="font-bold text-lg">{p.title}</h3>
            <p className="text-sm text-slate-500 mt-2">{p.protocol_steps?.length || 0} 단계 · {p.time_estimate}</p>
          </div>
        ))}
      </div>
    </div>
  )
}