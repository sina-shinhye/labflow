'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [session, setSession] = useState<any>(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false) // 회원가입 전환 상태 추가

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
  }, [])

  // 로그인/회원가입 처리 함수
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) alert('회원가입 실패: ' + error.message);
      else alert('인증 이메일이 발송되었습니다.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) alert('로그인 실패: ' + error.message);
    }
  }

  // 로그인/회원가입 창
  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF8F8]">
        <div className="p-10 rounded-2xl w-full max-w-sm bg-white border border-[#EAE0E0] shadow-xl text-center">
          <div className="w-12 h-12 bg-[#C41E3A] rounded-xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">K</div>
          <h1 className="text-2xl font-bold mb-6">{isRegister ? 'LabFlow 회원가입' : 'LabFlow 로그인'}</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="이메일" className="w-full p-3 border rounded-lg outline-none" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
            <input type="password" placeholder="비밀번호" className="w-full p-3 border rounded-lg outline-none" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
            <button className="w-full py-3 bg-[#C41E3A] text-white rounded-lg font-bold">
              {isRegister ? '가입하기' : '들어가기'}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              {isRegister ? '이미 계정이 있으신가요?' : 'LabFlow가 처음이신가요?'}
              <button 
                onClick={() => setIsRegister(!isRegister)} 
                className="ml-2 text-[#C41E3A] font-bold underline"
              >
                {isRegister ? '로그인' : '계정 만들기'}
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-[#1A1A2E]">연구실 대시보드 👋</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-[#EAE0E0] rounded-2xl shadow-sm">
          <p className="text-[#8E90A6] text-xs font-bold uppercase mb-2">오늘의 상태</p>
          <p className="text-2xl font-bold">모든 시스템 정상</p>
        </div>
        {/* 추가적인 요약 카드들을 여기에 넣을 수 있습니다. */}
      </div>
    </div>
  )
}