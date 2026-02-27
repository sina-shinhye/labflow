'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [reagents, setReagents] = useState<any[]>([])

  useEffect(() => {
    async function getReagents() {
      // Supabase의 'reagents' 테이블에서 모든 데이터를 가져옵니다.
      const { data, error } = await supabase.from('reagents').select('*')
      if (error) {
        console.error('Error loading reagents:', error)
      } else if (data) {
        setReagents(data)
      }
    }
    getReagents()
  }, [])

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2563eb' }}>🧪 LabFlow 시약 관리 시스템</h1>
      <p>데이터베이스와 실시간으로 연결된 상태입니다.</p>
      <hr style={{ margin: '20px 0' }} />
      
      <div style={{ display: 'grid', gap: '15px' }}>
        {reagents.length === 0 ? (
          <p>데이터를 불러오는 중이거나 아직 등록된 시약이 없습니다.</p>
        ) : (
          reagents.map((r) => (
            <div key={r.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>{r.name}</h3>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#667085' }}>
                <strong>제조사:</strong> {r.brand} | <strong>위치:</strong> {r.location}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>잔량:</strong> {r.remaining}%
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}