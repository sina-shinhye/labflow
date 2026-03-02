'use client'
import { useState, useRef, useEffect } from 'react'

const C = {
  accent: "#C41E3A", accentDim: "rgba(196,30,58,0.08)",
  border: "#EAE0E0", text: "#1A1A2E", sub: "#555770"
}

export default function AIPage() {
  const [msgs, setMsgs] = useState([{ r: 'ai', t: "안녕하세요! KIST Europe AI 어시스턴트입니다. 🧬\n실험 트러블슈팅이나 프로토콜 생성을 도와드릴까요?" }])
  const [inp, setInp] = useState("")
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const send = () => {
    if (!inp.trim()) return
    const userInp = inp.trim()
    setMsgs(p => [...p, { r: 'user', t: userInp }])
    setInp("")

    // 간단한 AI 응답 시뮬레이션
    setTimeout(() => {
      setMsgs(p => [...p, { r: 'ai', t: `'${userInp}'에 대해 분석 중입니다. 프로토콜 생성 기능이 곧 연결됩니다.` }])
    }, 1000)
  }

  return (
    <div className="flex flex-col h-full p-8">
      <h2 className="text-2xl font-bold mb-6">🤖 AI 어시스턴트</h2>
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            m.r === 'user' ? 'bg-[#C41E3A] text-white self-end ml-auto' : 'bg-white border self-start'
          }`} style={{ borderColor: m.r === 'ai' ? C.border : 'none' }}>
            {m.t}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 pt-4 border-t">
        <input className="flex-1 p-3 border rounded-xl outline-none text-sm" placeholder="질문을 입력하세요..." 
          value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} className="px-6 bg-[#C41E3A] text-white rounded-xl font-bold">전송</button>
      </div>
    </div>
  )
}