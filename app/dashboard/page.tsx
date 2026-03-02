'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const C = {
  bg: "#FAF8F8", border: "#EAE0E0", accent: "#C41E3A", accentDim: "rgba(196,30,58,0.08)",
  text: "#1A1A2E", sub: "#555770", muted: "#8E90A6",
  ok: "#0F9D58", warning: "#E67E22", danger: "#C0392B", info: "#2C6FBB"
}

export default function Dashboard() {
  const [stats, setStats] = useState({ reagents: 0, protocols: 0, equipment: 0 })
  const [alerts, setAlerts] = useState<any[]>([])
  const [latestProtos, setLatestProtos] = useState<any[]>([])
  const [equipStatus, setEquipStatus] = useState<any[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      // 1. 통계 및 시약 경고 (low/expiring)
      const { data: rs } = await supabase.from('reagents').select('*')
      const { data: ps } = await supabase.from('protocols').select('*').order('created_at', { ascending: false }).limit(3)
      const { data: es } = await supabase.from('equipment').select('*')

      if (rs) {
        setStats(prev => ({ ...prev, reagents: rs.length }))
        setAlerts(rs.filter(r => r.status !== 'ok')) // 경고 시약 추출
      }
      if (ps) {
        setStats(prev => ({ ...prev, protocols: ps.length }))
        setLatestProtos(ps) // 최신 프로토콜
      }
      if (es) {
        setStats(prev => ({ ...prev, equipment: es.length }))
        setEquipStatus(es) // 기기 상태
      }
    }
    loadDashboardData()
  }, [])

  return (
    <div className="p-8 space-y-8" style={{ background: C.bg }}>
      {/* 헤더 영역 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>Welcome, KIST Europe Lab 👋</h1>
          <p className="text-sm" style={{ color: C.sub }}>오늘의 실험실 통합 현황입니다.</p>
        </div>
        <Link href="/upload">
          <button className="px-4 py-2 rounded-lg text-white font-semibold shadow-md" style={{ background: C.accent }}>
            📄 문서 업로드
          </button>
        </Link>
      </div>

      {/* 4열 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "전체 시약", value: stats.reagents, color: C.info },
          { label: "보유 프로토콜", value: stats.protocols, color: C.accent },
          { label: "관리 기기", value: stats.equipment, color: C.ok },
          { label: "시약 경고", value: alerts.length, color: C.warning }
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border shadow-sm" style={{ borderColor: C.border }}>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>{s.label}</p>
            <p className="text-2xl font-bold mt-2 font-mono" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 메인 현황 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 최근 업로드 프로토콜 */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm" style={{ borderColor: C.border }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold" style={{ color: C.text }}>최근 업데이트 프로토콜</h3>
            <Link href="/protocols" className="text-xs font-bold" style={{ color: C.accent }}>전체보기 →</Link>
          </div>
          <div className="space-y-3">
            {latestProtos.map(p => (
              <Link href="/protocols" key={p.id} className="block p-3 rounded-xl border hover:bg-[#FFF5F5] transition-colors" style={{ borderColor: C.border }}>
                <p className="text-sm font-bold">{p.title}</p>
                <p className="text-[11px] mt-1" style={{ color: C.muted }}>{p.source} · {p.category}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* 시약 경고 현황 */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm" style={{ borderColor: C.border }}>
          <h3 className="font-bold mb-4" style={{ color: C.text }}>⚠️ 시약 재고/기한 알림</h3>
          <div className="space-y-2">
            {alerts.length > 0 ? alerts.map(r => (
              <div key={r.id} className="flex justify-between items-center p-3 rounded-xl" 
                   style={{ background: r.status === 'low' ? 'rgba(230,126,34,0.08)' : 'rgba(192,57,43,0.08)' }}>
                <span className="text-sm font-semibold">{r.name}</span>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-white shadow-sm" 
                      style={{ color: r.status === 'low' ? C.warning : C.danger }}>
                  {r.status === 'low' ? `재고부족: ${r.remaining}%` : `기한만료: ${r.expiry_date}`}
                </span>
              </div>
            )) : <p className="text-sm text-center py-10" style={{ color: C.muted }}>모든 시약 상태 양호</p>}
          </div>
        </div>

        {/* 기기 가동 현황 */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm lg:col-span-2" style={{ borderColor: C.border }}>
          <h3 className="font-bold mb-4" style={{ color: C.text }}>⚙️ 실시간 기기 상태</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {equipStatus.map(eq => (
              <div key={eq.id} className="p-3 rounded-xl border flex flex-col items-center text-center" style={{ borderColor: C.border }}>
                <div className="w-2 h-2 rounded-full mb-2" style={{ background: eq.status === 'Available' ? C.ok : C.warning }} />
                <p className="text-xs font-bold truncate w-full">{eq.name}</p>
                <p className="text-[10px] mt-1" style={{ color: C.muted }}>{eq.status}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}