"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail } from "@/lib/auth/auth";
import { migrateGuestEvaluationsToUser } from "@/lib/auth/migration";
import { createClient } from "@/lib/supabase/client";
import { getGuestId, clearGuestId } from "@/lib/utils/guest";
import Button from "@/components/ui/Button";

/**
 * 로그인 폼 컴포넌트
 * "이전 평가 다시 확인하기" 플로우에서 사용
 */
export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 이메일 입력 */}
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일을 입력해주세요."
          required
          className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm focus:border-zinc-500 focus:outline-none"
          disabled={isLoading}
        />
      </div>

      {/* 비밀번호 입력 */}
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력해주세요."
          required
          className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm focus:border-zinc-500 focus:outline-none"
          disabled={isLoading}
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 로그인 버튼 */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={isLoading || !email || !password}
      >
        {isLoading ? "로그인 중..." : "내 평가 확인하기"}
      </Button>
    </form>
  );
}

