"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 전역 네비게이션 바 (GNB)
 * 홈 화면 / 내 평가 화면 이동
 */
export default function GlobalNav() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isMyEvaluations = pathname === "/my-evaluations";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-md items-center justify-around">
        <Link
          href="/"
          className={`flex flex-1 flex-col items-center gap-1 px-4 py-3 transition-colors ${
            isHome
              ? "text-black"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <svg
            className="h-6 w-6"
            fill={isHome ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-xs font-medium">홈</span>
        </Link>

        <Link
          href="/my-evaluations"
          className={`flex flex-1 flex-col items-center gap-1 px-4 py-3 transition-colors ${
            isMyEvaluations
              ? "text-black"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <svg
            className="h-6 w-6"
            fill={isMyEvaluations ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-xs font-medium">내 평가</span>
        </Link>
      </div>
    </nav>
  );
}

