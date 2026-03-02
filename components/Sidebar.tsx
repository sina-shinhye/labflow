'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const C = { nav: "#C41E3A", navDim: "rgba(255,255,255,0.7)" }

export default function Sidebar({ userEmail, onLogout }: { userEmail: string, onLogout: () => void }) {
  const pathname = usePathname()
  
  const menu = [
    { name: '대시보드', href: '/', icon: '📊' },
    { name: '시약 관리', href: '/reagents', icon: '🧪' },
    { name: '프로토콜', href: '/protocols', icon: '📋' },
    { name: '업로드/OCR', href: '/upload', icon: '📷' },
  ]

  return (
    <nav className="w-56 shrink-0 flex flex-col py-6 px-4 h-screen" style={{ background: C.nav }}>
      <div className="text-white font-bold text-xl mb-8 px-2 italic">LabFlow</div>
      <div className="flex flex-col gap-2 flex-1">
        {menu.map((m) => (
          <Link key={m.href} href={m.href} className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-all ${pathname === m.href ? 'bg-white/20 text-white font-bold' : 'text-white/70 hover:bg-white/10'}`}>
            <span>{m.icon}</span> {m.name}
          </Link>
        ))}
      </div>
      <div className="pt-4 border-t border-white/20">
        <div className="text-[10px] text-white/50 px-2 mb-2 truncate">{userEmail}</div>
        <button onClick={onLogout} className="w-full py-2 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors">로그아웃</button>
      </div>
    </nav>
  )
}