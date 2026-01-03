import React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Header 컴포넌트
 * 화면 상단 헤더 (ID, 타이틀, 로그인/로그아웃)
 */
export interface HeaderProps {
  userId?: string | null;
  title: string;
  subtitle?: string;
  onLogout?: () => void;
  onLogin?: () => void;
  showLogout?: boolean;
  showLogin?: boolean;
}

export default function Header({
  userId,
  title,
  subtitle,
  onLogout,
  onLogin,
  showLogout = false,
  showLogin = false,
}: HeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {userId && (
          <p className="text-sm text-zinc-600">ID: {userId}</p>
        )}
        {!userId && <div />}
        
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold text-black">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
          )}
        </div>
        
        {showLogout && onLogout ? (
          <button
            onClick={onLogout}
            className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            aria-label="로그아웃"
          >
            로그아웃
          </button>
        ) : showLogin && onLogin ? (
          <button
            onClick={onLogin}
            className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            aria-label="로그인"
          >
            로그인
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>
    </div>
  );
}

