'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const C = {
  border: "#EAE0E0", accent: "#C41E3A", accentDim: "rgba(196,30,58,0.08)",
  text: "#1A1A2E", sub: "#555770", bg: "#FAF8F8", ok: "#0F9D58", warning: "#E67E22", info: "#2C6FBB"
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<any[]>([])
  const [selectedEq, setSelectedEq] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'qs' | 'tips' | 'logs' | 'data' | 'res'>('qs')
  
  // 상태 관리
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditingManual, setIsEditingManual] = useState(false)
  const [manualText, setManualText] = useState('')
  const [chartData, setChartData] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([]) // 예약 데이터 상태 추가
  const [newLog, setNewLog] = useState({ user: '', purpose: '' })
  const [resForm, setResForm] = useState({ user: '', date: '', time: '' }) // 예약 폼 상태
  const [newEq, setNewEq] = useState({ name: '', model: '', location: '', manager: '', contact: '', dept: '', isExternal: false, extEmail: '' })
  
  // 엔지니어 관리 상태
  const [uploading, setUploading] = useState(false)

  useEffect(() => { loadEquipment() }, [])

  const loadEquipment = async () => {
    const { data } = await supabase.from('equipment').select('*').order('name')
    if (data) setEquipment(data)
  }

  const loadEqDetails = async (eq: any) => {
    setSelectedEq(eq)
    setManualText(eq.manual_content || "매뉴얼 내용을 입력해주세요.")
    
    // 로그, 시각화 데이터, 예약 내역 병렬 로드
    const [{ data: logData }, { data: dData }, { data: resData }] = await Promise.all([
      supabase.from('equipment_logs').select('*').eq('equipment_id', eq.id).order('created_at', { ascending: false }),
      supabase.from('equipment_data').select('*').eq('equipment_id', eq.id).order('recorded_at', { ascending: true }).limit(10),
      supabase.from('equipment_reservations').select('*').eq('equipment_id', eq.id).order('res_date', { ascending: true })
    ])

    if (logData) setLogs(logData)
    if (dData) setChartData(dData)
    if (resData) setReservations(resData)
  }

  // 🗓️ 예약 처리 로직
  const handleReserve = async () => {
    if (!resForm.user || !resForm.date || !resForm.time) return alert("예약 정보를 모두 입력하세요.")
    const { error } = await supabase.from('equipment_reservations').insert([{
      equipment_id: selectedEq.id,
      user_name: resForm.user,
      res_date: resForm.date,
      res_time: resForm.time
    }])
    if (!error) {
      alert("예약이 완료되었습니다.")
      setResForm({ user: '', date: '', time: '' })
      loadEqDetails(selectedEq)
    }
  }

  const saveManual = async () => {
    const { error } = await supabase.from('equipment').update({ manual_content: manualText }).eq('id', selectedEq.id)
    if (!error) {
      alert("매뉴얼이 업데이트되었습니다.")
      setIsEditingManual(false)
      loadEquipment()
    }
  }

  const handleCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = e.target.files?.[0]
      if (!file || !selectedEq) return
      const fileExt = file.name.split('.').pop()
      const fileName = `${selectedEq.id}-${Math.random()}.${fileExt}`
      const filePath = `engineer-cards/${fileName}`
      const { error: uploadError } = await supabase.storage.from('equipment').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('equipment').getPublicUrl(filePath)
      await supabase.from('equipment').update({ engineer_card_url: publicUrl }).eq('id', selectedEq.id)
      setSelectedEq({ ...selectedEq, engineer_card_url: publicUrl })
      alert("명함 사진이 등록되었습니다.")
    } catch (error: any) {
      alert("업로드 실패: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const addEquipment = async () => {
    const { error } = await supabase.from('equipment').insert([{
      name: newEq.name, model: newEq.model, location: newEq.location,
      manager: newEq.manager, manager_contact: newEq.contact, manager_dept: newEq.dept, 
      status: 'Available', is_external: newEq.isExternal, external_email: newEq.extEmail
    }])
    if (!error) { alert("기기가 등록되었습니다."); setIsAddModalOpen(false); loadEquipment(); }
  }

  if (selectedEq) {
    return (
      <div className="p-8 max-w-5xl space-y-6 animate-in fade-in duration-300">
        <button onClick={() => setSelectedEq(null)} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">← 목록으로 돌아가기</button>
        
        <div className="bg-white rounded-3xl border p-8 shadow-sm flex flex-col md:flex-row justify-between items-start gap-6" style={{ borderColor: C.border }}>
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${selectedEq.is_external ? 'bg-orange-500' : 'bg-blue-500'}`}>
                {selectedEq.is_external ? '외부 기기' : '내부 기기'}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" 
                    style={{ background: selectedEq.status === 'Available' ? '#ECFDF5' : '#FFF7ED', color: selectedEq.status === 'Available' ? C.ok : C.warning }}>
                ● {selectedEq.status}
              </span>
            </div>
            <h2 className="text-4xl font-extrabold" style={{ color: C.text }}>{selectedEq.name}</h2>
            {selectedEq.is_external && selectedEq.external_email && (
              <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl">
                <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">외부 예약 문의처</p>
                <a href={`mailto:${selectedEq.external_email}`} className="text-sm font-bold text-orange-700 underline underline-offset-4">{selectedEq.external_email}</a>
              </div>
            )}
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Machine Info</p>
                <p className="font-semibold">{selectedEq.model} / {selectedEq.location}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Manager</p>
                <p className="font-semibold">{selectedEq.manager} ({selectedEq.manager_dept})</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-72 bg-slate-50 p-5 rounded-2xl border space-y-4" style={{ borderColor: C.border }}>
            <div className="flex justify-between items-center">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Technical Support</p>
              <label className="text-[10px] font-bold text-[#C41E3A] cursor-pointer hover:underline">
                {uploading ? "업로드 중..." : "명함 수정"}
                <input type="file" className="hidden" accept="image/*" onChange={handleCardUpload} disabled={uploading} />
              </label>
            </div>
            {selectedEq.engineer_card_url ? (
              <div className="group relative rounded-xl overflow-hidden border shadow-sm">
                <img src={selectedEq.engineer_card_url} alt="Engineer Card" className="w-full h-32 object-cover" />
                <a href={selectedEq.engineer_card_url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-all">자세히 보기</a>
              </div>
            ) : (
              <div className="h-32 border-2 border-dashed rounded-xl flex items-center justify-center text-[10px] text-slate-400 italic">등록된 명함 없음</div>
            )}
            <div className="space-y-1">
              <input className="w-full bg-transparent text-xs font-bold outline-none border-b border-transparent focus:border-[#C41E3A]" placeholder="엔지니어 성함" value={selectedEq.engineer_name || ''} readOnly />
              <input className="w-full bg-transparent text-xs text-slate-500 outline-none border-b border-transparent focus:border-[#C41E3A]" placeholder="연락처" value={selectedEq.engineer_contact || ''} readOnly />
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
          {[
            { id: 'qs', l: '매뉴얼 편집' },
            { id: 'res', l: '기기 예약' }, // 예약 탭 추가
            { id: 'data', l: '데이터 시각화' },
            { id: 'logs', l: '사용 기록' }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-white shadow-md text-[#C41E3A]' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.l}
            </button>
          ))}
        </div>

        <div className="bg-white border rounded-3xl p-8 shadow-sm min-h-[400px]" style={{ borderColor: C.border }}>
          {activeTab === 'res' && ( // 예약 UI 섹션
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h3 className="font-bold text-lg">📅 예약 신청</h3>
                <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
                  <input placeholder="예약자 성함" className="w-full p-3 rounded-xl border-none text-sm outline-none" value={resForm.user} onChange={e => setResForm({...resForm, user: e.target.value})} />
                  <div className="flex gap-2">
                    <input type="date" className="flex-1 p-3 rounded-xl border-none text-sm outline-none" value={resForm.date} onChange={e => setResForm({...resForm, date: e.target.value})} />
                    <input type="time" className="flex-1 p-3 rounded-xl border-none text-sm outline-none" value={resForm.time} onChange={e => setResForm({...resForm, time: e.target.value})} />
                  </div>
                  <button onClick={handleReserve} className="w-full py-3 bg-[#C41E3A] text-white rounded-xl font-bold shadow-lg transform active:scale-95 transition-all">예약 신청 완료</button>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-lg">📝 승인된 예약 현황</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {reservations.length > 0 ? reservations.map(r => (
                    <div key={r.id} className="p-4 border rounded-2xl flex justify-between items-center text-sm">
                      <span className="font-bold">{r.user_name}</span>
                      <span className="text-slate-500 font-mono">{r.res_date} {r.res_time}</span>
                    </div>
                  )) : <p className="text-slate-400 italic text-sm text-center py-10">현재 예약 내역이 없습니다.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">📖 기기 매뉴얼</h3>
                <button onClick={() => isEditingManual ? saveManual() : setIsEditingManual(true)} 
                        className="px-4 py-2 rounded-xl text-white text-xs font-bold transition-transform active:scale-95" style={{ background: isEditingManual ? C.ok : C.accent }}>
                  {isEditingManual ? "💾 변경사항 저장" : "📝 매뉴얼 수정"}
                </button>
              </div>
              {isEditingManual ? (
                <textarea className="w-full h-64 p-4 bg-slate-50 border rounded-2xl font-mono text-sm outline-none focus:ring-2 ring-red-100" 
                          value={manualText} onChange={e => setManualText(e.target.value)} />
              ) : (
                <div className="p-6 bg-[#FAF8F8] rounded-2xl whitespace-pre-wrap text-sm leading-relaxed text-slate-600 border border-dashed border-slate-200">
                  {selectedEq.manual_content || "등록된 매뉴얼 내용이 없습니다. 수정을 눌러 입력해 주세요."}
                </div>
              )}
            </div>
          )}
          {activeTab === 'data' && (
            <div className="space-y-8">
              <h3 className="font-bold text-lg">📊 실험 데이터 트렌드 (최근 10회)</h3>
              <div className="relative h-64 w-full flex items-end gap-4 px-4 border-b border-l border-slate-100">
                {chartData.length > 0 ? chartData.map((d, i) => (
                  <div key={i} className="flex-1 group relative flex flex-col items-center">
                    <div className="w-full bg-[#C41E3A]/20 rounded-t-lg transition-all hover:bg-[#C41E3A]/40" 
                         style={{ height: `${(d.value / 100) * 200}px` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.value}
                      </div>
                    </div>
                    <span className="absolute -bottom-6 text-[9px] text-slate-400 font-mono rotate-45 origin-left">{new Date(d.recorded_at).toLocaleDateString()}</span>
                  </div>
                )) : <p className="absolute inset-0 flex items-center justify-center text-slate-300 italic">데이터가 충분하지 않습니다.</p>}
              </div>
            </div>
          )}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">📝 기기 사용 로그</h3>
              <div className="grid gap-3">
                {logs.map(l => (
                  <div key={l.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-transparent hover:border-slate-200 transition-all">
                    <div>
                      <p className="font-bold text-sm">{l.user_name}</p>
                      <p className="text-xs text-slate-500 mt-1">{l.purpose}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-1 rounded-lg border">{new Date(l.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black" style={{ color: C.text }}>⚙️ Equipment</h2>
          <p className="text-sm text-slate-400 mt-1">연구실 내 가동 기기 통합 관리 시스템</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-3 rounded-2xl text-white font-bold shadow-lg hover:-translate-y-1 transition-all" style={{ background: C.accent }}>
          + 새 기기 추가
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map(eq => (
          <div key={eq.id} onClick={() => loadEqDetails(eq)} 
               className="bg-white border rounded-[32px] p-8 cursor-pointer hover:shadow-2xl hover:border-[#C41E3A]/20 transition-all group" style={{ borderColor: C.border }}>
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner bg-slate-50 group-hover:bg-red-50 transition-colors">🔬</div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${eq.is_external ? 'border-orange-200 text-orange-600' : 'border-blue-200 text-blue-600'}`}>
                {eq.is_external ? 'External' : 'Internal'}
              </span>
            </div>
            <h3 className="text-xl font-bold group-hover:text-[#C41E3A] transition-colors">{eq.name}</h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">{eq.model} · {eq.location}</p>
            <div className="mt-6 pt-6 border-t flex justify-between items-center" style={{ borderColor: C.border }}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details View →</span>
              <span className="text-[10px] font-bold text-slate-900">{eq.manager}</span>
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-10 rounded-[40px] w-full max-w-lg shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black">🛠️ New Equipment</h3>
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="기기명" className="p-3 bg-slate-50 border-none rounded-2xl text-sm outline-none" onChange={e => setNewEq({...newEq, name: e.target.value})} />
              <input placeholder="모델명" className="p-3 bg-slate-50 border-none rounded-2xl text-sm outline-none" onChange={e => setNewEq({...newEq, model: e.target.value})} />
              <input placeholder="위치" className="col-span-2 p-3 bg-slate-50 border-none rounded-2xl text-sm outline-none" onChange={e => setNewEq({...newEq, location: e.target.value})} />
              <div className="col-span-2 flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                <input type="checkbox" className="w-4 h-4 accent-[#C41E3A]" onChange={e => setNewEq({...newEq, isExternal: e.target.checked})} />
                <span className="text-sm font-bold text-slate-600">외부 연구실 기기입니까?</span>
              </div>
              {newEq.isExternal && (
                <input placeholder="예약 신청 메일 주소" className="col-span-2 p-3 bg-orange-50 border border-orange-100 rounded-2xl text-sm outline-none" onChange={e => setNewEq({...newEq, extEmail: e.target.value})} />
              )}
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600">Cancel</button>
              <button onClick={addEquipment} className="flex-[2] py-4 text-white rounded-2xl font-bold shadow-lg" style={{ background: C.accent }}>Add Machine</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}