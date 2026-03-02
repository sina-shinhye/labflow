'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const C = {
  bg: "#FAF8F8", border: "#EAE0E0", accent: "#C41E3A", accentDim: "rgba(196,30,58,0.08)",
  text: "#1A1A2E", sub: "#555770", muted: "#8E90A6",
  ok: "#0F9D58", okDim: "rgba(15,157,88,0.1)",
  info: "#2C6FBB", infoDim: "rgba(44,111,187,0.1)",
  purple: "#7C3AED", purpleDim: "rgba(124,58,237,0.1)"
}

export default function UploadPage() {
  const [mode, setMode] = useState<'file' | 'notebook' | 'printed' | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<'notebook' | 'protocol' | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  
  // 편집용 상태
  const [nbTitle, setNbTitle] = useState("")
  const [nbText, setNbText] = useState("")
  const [steps, setSteps] = useState<any[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 3종 업로드 처리 (Mock AI 시뮬레이션)
  const handleProcess = async (type: 'notebook' | 'protocol') => {
    setLoading(true)
    // 2.5초 AI 분석 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    if (type === 'notebook') {
      setResult('notebook')
      setNbTitle("WB — β-actin 검증 (Exp #WB-042)")
      setNbText("Sample: HeLa WT vs KO (passage 12)\nLoading: 30μg/lane\nResult: Band at ~42 kDa 확인.")
    } else {
      setResult('protocol')
      setSteps([
        { s: 1, t: "배양균 수확", d: "LB/Amp 1.5-3mL → 13,000rpm 1분", tm: "5 min", rg: ["LB/Amp"] },
        { s: 2, t: "Resuspension", d: "Buffer P1 250μL로 pellet 현탁", tm: "3 min", rg: ["P1"] }
      ])
    }
    setLoading(false)
  }

  // 데이터베이스 저장 로직
  const saveToDatabase = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (result === 'notebook') {
      await supabase.from('lab_notebooks').insert({
        title: nbTitle,
        content: nbText,
        from_ocr: true,
        created_by: user?.id
      })
      alert('실험노트가 저장되었습니다.')
    } else {
      const { data: proto } = await supabase.from('protocols').insert({
        title: "새 프로토콜 (OCR)",
        category: "미분류",
        from_ai: true
      }).select().single()
      
      if (proto) {
        const stepsToInsert = steps.map(s => ({
          protocol_id: proto.id,
          step_number: s.s,
          title: s.t,
          description: s.d,
          time_estimate: s.tm,
          reagents: s.rg
        }))
        await supabase.from('protocol_steps').insert(stepsToInsert)
        alert('프로토콜 라이브러리에 저장되었습니다.')
      }
    }
    setResult(null)
  }

  // 1. 처리 중 화면 (스피너)
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-[#C41E3A] rounded-full animate-spin" />
      <p className="font-bold text-lg">AI가 문서를 분석 중...</p>
    </div>
  )

  // 2. 실험노트 편집 화면
  if (result === 'notebook') return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => setResult(null)} className="text-sm text-slate-500">← 돌아가기</button>
        <button onClick={saveToDatabase} className="px-6 py-2 bg-[#C41E3A] text-white rounded-xl font-bold shadow-lg">💾 저장</button>
      </div>
      <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-4" style={{ borderColor: C.border }}>
        <input className="w-full text-xl font-bold border-b-2 outline-none py-2" value={nbTitle} onChange={e => setNbTitle(e.target.value)} />
        <textarea className="w-full h-64 p-4 bg-[#FFFBFB] border rounded-xl font-mono text-sm leading-relaxed outline-none" value={nbText} onChange={e => setNbText(e.target.value)} />
      </div>
    </div>
  )

  // 3. 프로토콜 편집 화면
  if (result === 'protocol') return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => setResult(null)} className="text-sm text-slate-500">← 돌아가기</button>
        <button onClick={saveToDatabase} className="px-6 py-2 bg-[#C41E3A] text-white rounded-xl font-bold shadow-lg">💾 프로토콜 저장</button>
      </div>
      <div className="space-y-4">
        {steps.map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border flex gap-4 shadow-sm" style={{ borderColor: C.border }}>
            <div className="w-8 h-8 rounded-lg bg-[#FFF5F5] text-[#C41E3A] flex items-center justify-center font-bold">{s.s}</div>
            <div className="flex-1 space-y-2">
              <input className="w-full font-bold border-b border-dashed outline-none" value={s.t} onChange={e => {
                const newSteps = [...steps]; newSteps[i].t = e.target.value; setSteps(newSteps);
              }} />
              <textarea className="w-full text-sm text-slate-500 border-b border-dashed outline-none" value={s.d} onChange={e => {
                const newSteps = [...steps]; newSteps[i].d = e.target.value; setSteps(newSteps);
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // 4. 초기 선택 화면
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold">📄 문서 업로드 & 디지털화</h2>
        <p className="text-slate-500 text-sm mt-1">프로토콜, 실험노트, 인쇄물 → AI 자동 디지털화</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { id: 'file', icon: '📁', title: '프로토콜 파일', desc: 'PDF, HWP, Word 변환', color: C.accent, type: 'protocol' },
          { id: 'notebook', icon: '📓', title: '실험노트 촬영', desc: '손글씨 → 전자 문서', color: C.info, type: 'notebook' },
          { id: 'printed', icon: '📷', title: '인쇄물 스캔', desc: '매뉴얼 → 디지털화', color: C.purple, type: 'protocol' },
        ].map(m => (
          <div key={m.id} onClick={() => handleProcess(m.type as any)} 
               className="bg-white p-8 rounded-2xl border-2 border-transparent hover:border-slate-200 cursor-pointer text-center transition-all hover:-translate-y-1 shadow-sm">
            <div className="text-4xl mb-4">{m.icon}</div>
            <h3 className="font-bold text-lg mb-2">{m.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}