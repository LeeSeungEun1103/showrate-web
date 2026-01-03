"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/auth";
import { signInWithEmail } from "@/lib/auth/auth";
import { migrateGuestEvaluationsToUser } from "@/lib/auth/migration";
import { createClient } from "@/lib/supabase/client";
import { getGuestId, clearGuestId } from "@/lib/utils/guest";
import Button from "@/components/ui/Button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * 랜딩 페이지
 * 로그인하지 않은 상태에서만 표시
 */
export default function LandingPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginSection, setShowLoginSection] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 인증 상태 확인
  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (user) {
        // 로그인한 상태면 "전체 평가" 화면으로 리다이렉트
        router.push("/");
        return;
      }
      setIsLoggedIn(false);
      setIsCheckingAuth(false);
    }
    checkAuth();
  }, [router]);

  // 로그인 폼 제출
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const result = await signInWithEmail(email, password);

      if (result.error) {
        setError(result.error.message);
        setIsLoading(false);
        return;
      }

      if (!result.user) {
        setError("로그인에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      // Guest 평가를 User 평가로 마이그레이션
      const guestId = getGuestId();
      if (guestId) {
        await migrateGuestEvaluationsToUser(
          supabase,
          guestId,
          result.user.id
        );
        clearGuestId();
      }

      // 내 평가 화면으로 리다이렉트
      router.push("/my-evaluations");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error ? err.message : "오류가 발생했습니다."
      );
      setIsLoading(false);
    }
  };

  // 새로 공연 평가 시작하기
  const handleStartEvaluation = () => {
    router.push("/evaluate");
  };

  // 로그인 없이 결과 확인하기
  const handleViewWithoutLogin = () => {
    router.push("/");
  };

  // 로딩 중이거나 로그인한 상태면 아무것도 표시하지 않음
  if (isCheckingAuth || isLoggedIn) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* ShowRate 로고 및 태그라인 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-zinc-900 mb-2">ShowRate</h1>
          <p className="text-base text-zinc-600">
            머리와 심장이 반응하는 공연은 다르잖아요
          </p>
        </div>

        {/* 새로 공연 평가 시작하기 버튼 */}
        <Button
          onClick={handleStartEvaluation}
          variant="primary"
          size="lg"
          fullWidth
          className="bg-black text-white hover:bg-zinc-800"
        >
          새로 공연 평가 시작하기
        </Button>

        {/* 이전 평가 다시 확인하기 섹션 */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <button
            type="button"
            onClick={() => setShowLoginSection(!showLoginSection)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-zinc-700">✓</span>
              <span className="font-medium text-zinc-900">
                이전 평가 다시 확인하기
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-zinc-500 transition-transform",
                showLoginSection && "rotate-180"
              )}
            />
          </button>

          {/* 로그인 폼 (접기/펼치기) */}
          {showLoginSection && (
            <form onSubmit={handleLogin} className="mt-4 space-y-3">
              {/* 이메일 입력 */}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력해주세요."
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
                disabled={isLoading}
              />

              {/* 비밀번호 입력 */}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력해주세요."
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
                disabled={isLoading}
              />

              {/* 에러 메시지 */}
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* 로그인 버튼 */}
              <Button
                type="submit"
                variant="secondary"
                size="md"
                fullWidth
                disabled={isLoading || !email || !password}
                className="bg-zinc-200 text-zinc-900 hover:bg-zinc-300"
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          )}
        </div>

        {/* 로그인 없이 결과 확인하기 */}
        <button
          onClick={handleViewWithoutLogin}
          className="w-full text-center text-sm text-zinc-600 underline hover:text-zinc-900"
        >
          로그인 없이 결과 확인하기
        </button>
      </div>
    </div>
  );
}

