'use client'
import "./globals.css";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <html lang="ko">
      <body className="antialiased bg-[#FAF8F8]">
        {loading ? (
          <div className="h-screen flex items-center justify-center font-bold">
            LabFlow 로딩 중...
          </div>
        ) : session ? (
          <div className="flex h-screen overflow-hidden">
            <Sidebar userEmail={session.user.email} onLogout={() => supabase.auth.signOut()} />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        ) : (
          // 로그인하지 않은 경우 (children이 page.tsx의 로그인 창을 보여줌)
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}