'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User, Session, SupabaseClient } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithKakao: () => Promise<void>
  signInWithNaver: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>
  signUpWithEmail: (email: string, password: string, metadata: any) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // useEffect 안에서만 생성 — 브라우저 전용 API 호출로 SSR에서 실행 안 됨
  const supabaseRef = useRef<SupabaseClient | null>(null)

  useEffect(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    const supabase = supabaseRef.current

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Tailscale IP 등으로 로컬 원격 접속 시엔 auth.nemoneai.com을 거치는 중앙 SSO 리다이렉트를 타면
  // 세션 쿠키가 .nemoneai.com에만 저장돼 이 origin으로 넘어오지 못해 로그인 무한루프가 생김 —
  // 그 경우 이 origin 안에서 자체적으로 OAuth를 완결(현재 origin의 /auth/callback으로 복귀)
  const isProdDomain = () => window.location.hostname.endsWith('nemoneai.com')

  const signInWithGoogle = async () => {
    if (!isProdDomain()) {
      const returnTo = window.location.pathname + window.location.search
      await supabaseRef.current!.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}` },
      })
      return
    }
    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3002'
    const currentUrl = window.location.href
    window.location.href = `${authUrl}/login?next=${encodeURIComponent(currentUrl)}`
  }

  const signInWithKakao = async () => {
    if (!isProdDomain()) {
      const returnTo = window.location.pathname + window.location.search
      await supabaseRef.current!.auth.signInWithOAuth({
        provider: 'kakao',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}` },
      })
      return
    }
    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3002'
    const currentUrl = window.location.href
    window.location.href = `${authUrl}/login?provider=kakao&next=${encodeURIComponent(currentUrl)}`
  }

  const signInWithNaver = async () => {
    if (!isProdDomain()) {
      const returnTo = window.location.pathname + window.location.search
      await supabaseRef.current!.auth.signInWithOAuth({
        provider: 'custom:naver' as any,
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}` },
      })
      return
    }
    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3002'
    const currentUrl = window.location.href
    window.location.href = `${authUrl}/login?provider=naver&next=${encodeURIComponent(currentUrl)}`
  }

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabaseRef.current!.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUpWithEmail = async (email: string, password: string, metadata: any) => {
    const { error } = await supabaseRef.current!.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signOut = async () => {
    // 로그아웃 후 통합인증센터로 강제 이동시키던 기존 로직 제거(2026-09-07) — .nemoneai.com
    // 도메인 쿠키라 signOut() 호출만으로 전 서비스 세션이 이미 정리되고, 인증센터로 보낼
    // 필요가 없는데도 보내서 "돌아올 방법이 없다"는 사용자 불만으로 이어졌음. 로그아웃은
    // 그냥 현재 페이지에 머물러 로그아웃 상태 UI를 보여주면 된다.
    await supabaseRef.current?.auth.signOut()
    window.location.reload()
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signInWithGoogle, signInWithKakao, signInWithNaver, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
