'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const C = {
  bg: "#FAF8F8", border: "#EAE0E0", accent: "#C41E3A", accentDim: "rgba(196,30,58,0.08)",
  text: "#1A1A2E", sub: "#555770", muted: "#8E90A6", ok: "#0F9D58", warning: "#E67E22"
}

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<any[]>([])
  const [reagents, setReagents] = useState<any[]>([]) // 시약 재고 데이터
  const [selectedProtocol, setSelectedProtocol] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('전체')
  
  const [categories, setCategories] = useState<string[]>(['전체'])
  const [newCatName, setNewCatName] = useState('')
  const [isManagingCats, setIsManagingCats] = useState(false)

  const [editingSteps, setEditingSteps] = useState<any[]>([])
  const [editingCategory, setEditingCategory] = useState('')

  useEffect(() => { 
    loadProtocols()
    loadCategories()
    loadReagents() 
  }, [])

  const loadProtocols = async () => {
    setLoading(true)
    const { data } = await supabase.from('protocols').select('*, protocol_steps(*)').order('created_at', { ascending: false })
    if (data) setProtocols(data)
    setLoading(false)
  }

  const loadReagents = async () => {
    const { data } = await supabase.from('reagents').select('name, remaining, status')
    if (data) setReagents(data)
  }

  const loadCategories = async () => {
    const { data } = await supabase.from('protocol_categories').select('name').order('name')
    if (data) setCategories(['전체', ...data.map(c => c.name)])
  }

  const checkReagentStock = (reagentName: string) => {
    const found = reagents.find(r => r.name.toLowerCase() === reagentName.toLowerCase())
    if (!found) return { status: 'none', msg: '재고 없음' }
    if (found.remaining <= 10 || found.status === 'low') return { status: 'low', msg: `잔량 부족 (${found.remaining}%)` }
    return { status: 'ok', msg: '보유 중' }
  }

  const addCategory = async () => {
    if (!newCatName.trim()) return
    const { error } = await supabase.from('protocol_categories').insert([{ name: newCatName.trim() }])
    if (error) alert("이미 존재하거나 오류가 발생했습니다.")
    else { setNewCatName(''); loadCategories(); }
  }

  const deleteCategory = async (name: string) => {
    if (confirm(`'${name}' 카테고리를 삭제하시겠습니까?`)) {
      const { error } = await supabase.from('protocol_categories').delete().eq('name', name)
      if (!error) loadCategories()
    }
  }

  const handleSelectProtocol = (p: any) => {
    setSelectedProtocol(p)
    setEditingCategory(p.category || (categories[1] || ''))
    const sortedSteps = [...(p.protocol_steps || [])].sort((a, b) => a.step_number - b.step_number)
    setEditingSteps(sortedSteps)
  }

  const moveStep = (idx: number, direction: 'up' | 'down') => {
    const newSteps = [...editingSteps];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newSteps.length) return;
    [newSteps[idx], newSteps[targetIdx]] = [newSteps[targetIdx], newSteps[idx]];
    const reorderedSteps = newSteps.map((s, i) => ({ ...s, step_number: i + 1 }));
    setEditingSteps(reorderedSteps);
  }

  const addStep = () => {
    const newStep = { id: `new-${Date.now()}`, step_number: editingSteps.length + 1, title: '', description: '', time_estimate: '', reagents: [] }
    setEditingSteps([...editingSteps, newStep])
  }

  const saveChanges = async () => {
    if (!selectedProtocol) return
    await supabase.from('protocols').update({ category: editingCategory }).eq('id', selectedProtocol.id)
    await supabase.from('protocol_steps').delete().eq('protocol_id', selectedProtocol.id)
    const stepsToInsert = editingSteps.map((s, i) => ({
      protocol_id: selectedProtocol.id,
      step_number: i + 1,
      title: s.title,
      description: s.description,
      time_estimate: s.time_estimate,
      reagents: s.reagents
    }))
    const { error } = await supabase.from('protocol_steps').insert(stepsToInsert)
    if (!error) { alert("저장되었습니다."); loadProtocols(); setSelectedProtocol(null); }
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
            <div><h1>${proto.title}</h1><p>Source: ${proto.source || 'LabFlow'}</p></div>
            <div style="text-align:right"><strong>KIST Europe</strong><br/>LabFlow Protocol</div>
          </div>
          ${editingSteps.map((s: any) => `
            <div class="step">
              <span class="step-num">${s.step_number}</span> <strong>${s.title}</strong>
              <p style="font-size: 13px; color: #444; margin: 8px 0;">${s.description}</p>
              <small>⏱ ${s.time_estimate || '-'} | Reagents: ${s.reagents?.join(', ') || '-'}</small>
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

  const filteredProtocols = protocols.filter(p => filter === '전체' || p.category === filter)

  if (selectedProtocol) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <button onClick={() => setSelectedProtocol(null)} className="text-sm font-semibold text-slate-500">← 목록으로 돌아가기</button>
            <h2 className="text-3xl font-bold">{selectedProtocol.title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">분류:</span>
              <select value={editingCategory} onChange={(e) => setEditingCategory(e.target.value)} className="text-xs p-1.5 border rounded-lg bg-white outline-none font-bold">
                {categories.filter(c => c !== '전체').map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => printPDF(selectedProtocol)} className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold hover:bg-white transition-all">🖨️ PDF 인쇄</button>
            <button onClick={saveChanges} className="px-5 py-2.5 rounded-xl text-white font-bold shadow-lg" style={{ background: C.accent }}>💾 저장</button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Step & Reagent Editor</h4>
          {editingSteps.map((step, idx) => (
            <div key={step.id} className="p-6 rounded-2xl flex gap-5 bg-white border group transition-all" style={{ borderColor: C.border }}>
              <div className="flex flex-col gap-2 items-center shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ background: C.accentDim, color: C.accent }}>{idx + 1}</div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveStep(idx, 'up')} className="p-1 rounded bg-slate-100 text-[10px] hover:bg-slate-200">▲</button>
                  <button onClick={() => moveStep(idx, 'down')} className="p-1 rounded bg-slate-100 text-[10px] hover:bg-slate-200">▼</button>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <input className="w-full font-bold text-lg border-b border-transparent focus:border-[#C41E3A] outline-none" value={step.title} onChange={e => { const n = [...editingSteps]; n[idx].title = e.target.value; setEditingSteps(n); }} placeholder="단계 제목" />
                <textarea className="w-full text-sm text-slate-500 outline-none resize-none" rows={2} value={step.description} onChange={e => { const n = [...editingSteps]; n[idx].description = e.target.value; setEditingSteps(n); }} placeholder="상세 설명" />
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <input className="text-[10px] font-bold p-1 border rounded w-20" value={step.time_estimate} onChange={e => { const n = [...editingSteps]; n[idx].time_estimate = e.target.value; setEditingSteps(n); }} placeholder="⏱ 시간" />
                    <input 
                      className="text-[10px] p-1 border rounded flex-1 outline-none focus:border-[#C41E3A]" 
                      placeholder="시약 입력 (콤마로 구분)" 
                      value={step.reagents?.join(', ') || ''}
                      onChange={e => {
                        const n = [...editingSteps];
                        n[idx].reagents = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        setEditingSteps(n);
                      }}
                    />
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    {step.reagents?.map((rg: string) => {
                      const stock = checkReagentStock(rg);
                      return (
                        <div key={rg} className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold border"
                             style={{ 
                               background: stock.status === 'ok' ? '#ECFDF5' : '#FFF7ED',
                               color: stock.status === 'ok' ? C.ok : C.warning,
                               borderColor: stock.status === 'ok' ? '#D1FAE5' : '#FFEDD5'
                             }}>
                          {rg}: {stock.msg} {stock.status !== 'ok' && '⚠️'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <button onClick={() => setEditingSteps(editingSteps.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
            </div>
          ))}
          <button onClick={addStep} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:bg-white hover:border-[#C41E3A] hover:text-[#C41E3A] transition-all">+ 단계 추가</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8" style={{ background: C.bg }}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: C.text }}>📚 프로토콜 라이브러리</h2>
        <button onClick={() => setIsManagingCats(!isManagingCats)} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold hover:bg-white transition-all">⚙️ 카테고리 관리</button>
      </div>

      {isManagingCats && (
        <div className="p-5 bg-white border rounded-2xl space-y-4 shadow-sm" style={{ borderColor: C.border }}>
          <h4 className="text-xs font-bold text-slate-400 uppercase">나만의 카테고리 설정</h4>
          <div className="flex gap-2 flex-wrap">
            {categories.filter(c => c !== '전체').map(cat => (
              <div key={cat} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                <span className="text-xs font-bold text-slate-700">{cat}</span>
                <button onClick={() => deleteCategory(cat)} className="text-slate-300 hover:text-red-500 font-bold">✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 max-w-sm">
            <input placeholder="새 카테고리 명칭" className="flex-1 text-xs p-2.5 border rounded-xl outline-none focus:border-[#C41E3A]" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
            <button onClick={addCategory} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all">추가</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === cat ? 'bg-white shadow-sm text-[#C41E3A]' : 'text-slate-500'}`}>{cat}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProtocols.map(p => (
          <div key={p.id} onClick={() => handleSelectProtocol(p)} className="p-6 rounded-2xl bg-white border cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group" style={{ borderColor: C.border }}>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 mb-3 inline-block uppercase tracking-wider">{p.category}</span>
            <h3 className="font-bold text-xl mb-2 group-hover:text-[#C41E3A] transition-colors">{p.title}</h3>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
              <span className="text-xs text-slate-400">{p.protocol_steps?.length || 0} 단계</span>
              <span className="text-xs font-bold" style={{ color: C.accent }}>편집하기 →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}