'use client'
import "./globals.css";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-bold">LabFlow 로딩 중...</div>;

  return (
    <html lang="ko">
      <body className="antialiased">
        {session ? (
          <div className="flex h-screen overflow-hidden bg-[#FAF8F8]">
            <Sidebar userEmail={session.user.email} onLogout={() => supabase.auth.signOut()} />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        ) : (
          // 로그인하지 않은 경우 page.tsx에서 로그인 창을 띄우도록 자식 요소만 렌더링
          <>{children}</>
        )}
      </body>
    </html>
  );
}