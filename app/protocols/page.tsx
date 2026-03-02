'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const C = {
  border: "#EAE0E0", accent: "#C41E3A", accentDim: "rgba(196,30,58,0.08)",
  text: "#1A1A2E", sub: "#555770", bg: "#FAF8F8", ok: "#0F9D58"
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

  // 🖨️ PDF 인쇄 함수
  const printPDF = (proto: any) => {
    const today = new Date().toLocaleDateString()
    const html = `
      <html>
        <head>
          <title>${proto.title}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1a1a2e; }
            .header { border-bottom: 3px solid #C41E3A; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .step { border: 1px solid #EAE0E0; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
            .step-num { color: #C41E3A; font-weight: bold; margin-right: 10px; }
            .footer { margin-top: 30px; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><h1>${proto.title}</h1><p>Source: ${proto.source}</p></div>
            <div style="text-align:right"><strong>KIST Europe</strong><br/>LabFlow Protocol</div>
          </div>
          ${proto.protocol_steps.sort((a:any, b:any) => a.step_number - b.step_number).map((s: any) => `
            <div class="step">
              <span class="step-num">${s.step_number}</span> <strong>${s.title}</strong>
              <p style="font-size: 13px; color: #444; margin: 8px 0;">${s.description}</p>
              <small>⏱ ${s.time_estimate} | Reagents: ${s.reagents?.join(', ') || '-'}</small>
            </div>
          `).join('')}
          <div class="footer">Printed on ${today} | KIST Europe LabFlow</div>
        </body>
      </html>
    `
    const win = window.open('', '_blank')
    win?.document.write(html)
    win?.document.close()
    setTimeout(() => win?.print(), 500)
  }

  if (selectedProtocol) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <button onClick={() => setSelectedProtocol(null)} className="text-sm font-semibold mb-4 text-slate-500">← 목록으로 돌아가기</button>
            <h2 className="text-3xl font-bold">{selectedProtocol.title}</h2>
            <p className="text-slate-500 mt-2">{selectedProtocol.source} · {selectedProtocol.difficulty}</p>
          </div>
          <button onClick={() => printPDF(selectedProtocol)} className="px-6 py-3 rounded-xl text-white font-bold shadow-lg" style={{ background: C.accent }}>
            🖨️ PDF 인쇄
          </button>
        </div>

        <div className="space-y-4">
          {selectedProtocol.protocol_steps?.sort((a:any, b:any) => a.step_number - b.step_number).map((step: any) => (
            <div key={step.id} className="p-6 rounded-2xl flex gap-5 bg-white border transition-all hover:border-[#C41E3A]/30" style={{ borderColor: C.border }}>
              <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold" style={{ background: C.accentDim, color: C.accent }}>
                {step.step_number}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-lg">{step.title}</h4>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-500">⏱ {step.time_estimate}</span>
                </div>
                <p className="text-slate-600 leading-relaxed mb-4">{step.description}</p>
                <div className="flex gap-2">
                  {step.reagents?.map((r: string, idx: number) => (
                    <span key={idx} className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-600 uppercase">{r}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-8">📋 프로토콜 라이브러리</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {protocols.map(p => (
          <div key={p.id} onClick={() => setSelectedProtocol(p)} className="p-6 rounded-2xl bg-white border cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all" style={{ borderColor: C.border }}>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 mb-3 inline-block uppercase">{p.category}</span>
            <h3 className="font-bold text-xl mb-2">{p.title}</h3>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
              <span className="text-xs text-slate-400">{p.protocol_steps?.length || 0} 단계</span>
              <span className="text-xs font-bold" style={{ color: C.accent }}>상세보기 →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}