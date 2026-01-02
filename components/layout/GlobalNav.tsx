"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, User, MessageCircleQuestion } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * 전역 네비게이션 바 (GNB)
 * 홈 화면 / 내 평가 화면 이동
 * Figma 디자인 기준: 하단 고정, 3개 탭 (전체 평가, 내 평가, 공연추가 요청/피드백)
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
          className={cn(
            "flex flex-1 flex-col items-center gap-1 px-4 py-3 transition-colors",
            isHome
              ? "text-black"
              : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          <Crown className={cn("h-6 w-6", isHome && "fill-current")} />
          <span className="text-xs font-medium">전체 평가</span>
        </Link>

        <Link
          href="/my-evaluations"
          className={cn(
            "flex flex-1 flex-col items-center gap-1 px-4 py-3 transition-colors",
            isMyEvaluations
              ? "text-black"
              : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          <User className={cn("h-6 w-6", isMyEvaluations && "fill-current")} />
          <span className="text-xs font-medium">내 평가</span>
        </Link>

        {/* 공연추가 요청/피드백 (향후 구현) */}
        <button
          className="flex flex-1 flex-col items-center gap-1 px-4 py-3 text-zinc-400 transition-colors hover:text-zinc-600"
          disabled
          onClick={() => {
            // TODO: 구글 설문 링크 열기
            window.open("https://forms.gle/...", "_blank");
          }}
        >
          <MessageCircleQuestion className="h-6 w-6" />
          <span className="text-xs font-medium">공연추가 요청/피드백</span>
        </button>
      </div>
    </nav>
  );
}

