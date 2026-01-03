"use client";

import { useState, useEffect } from "react";
import { signUpWithEmail, signInWithEmail, getCurrentUser } from "@/lib/auth/auth";
import { migrateGuestEvaluationsToUser } from "@/lib/auth/migration";
import { createClient } from "@/lib/supabase/client";
import { getGuestId, clearGuestId } from "@/lib/utils/guest";
import Button from "@/components/ui/Button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  totalEvaluations: number;
  mode?: "signup" | "login";
  onTotalUpdate?: (count: number) => void;
}

/**
 * 로그인/회원가입 모달
 * 평가 완료 후 이메일/비밀번호 입력을 받아 계정을 생성하거나 로그인
 */
export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  totalEvaluations,
  mode = "signup",
  onTotalUpdate,
}: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [currentTotal, setCurrentTotal] = useState(totalEvaluations);

  // totalEvaluations가 변경되면 실시간으로 업데이트
  useEffect(() => {
    setCurrentTotal(totalEvaluations);
  }, [totalEvaluations]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      let user;

      if (isSignUp) {
        // 회원가입
        const result = await signUpWithEmail(email, password);
        if (result.error) {
          setError(result.error.message);
          setIsLoading(false);
          return;
        }
        user = result.user;
      } else {
        // 로그인
        const result = await signInWithEmail(email, password);
        if (result.error) {
          setError(result.error.message);
          setIsLoading(false);
          return;
        }
        user = result.user;
      }

      if (!user) {
        setError("인증에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      // Guest 평가를 User 평가로 마이그레이션
      const guestId = getGuestId();
      if (guestId) {
        const migrationResult = await migrateGuestEvaluationsToUser(supabase, guestId, user.id);
        console.log("Migration result:", migrationResult);
        clearGuestId();
        
        // 마이그레이션 후 총 평가 수 다시 조회
        const { data: allEvaluations } = await supabase
          .from("evaluation")
          .select("id")
          .eq("user_id", user.id)
          .is("guest_id", null);
        
        const newTotal = allEvaluations?.length || 0;
        setCurrentTotal(newTotal);
        if (onTotalUpdate) {
          onTotalUpdate(newTotal);
        }
      } else {
        // Guest 평가가 없어도 현재 사용자의 평가 수 조회
        const { data: allEvaluations } = await supabase
          .from("evaluation")
          .select("id")
          .eq("user_id", user.id)
          .is("guest_id", null);
        
        const newTotal = allEvaluations?.length || 0;
        setCurrentTotal(newTotal);
        if (onTotalUpdate) {
          onTotalUpdate(newTotal);
        }
      }

      setIsLoading(false);
      onSuccess();
    } catch (err) {
      console.error("Auth error:", err);
      setError(
        err instanceof Error ? err.message : "오류가 발생했습니다."
      );
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-xl font-bold text-black">
            상위 3%
          </h2>
          <p className="text-sm text-zinc-600">
            총 공연 {currentTotal} 개를 평가하셨네요
          </p>
        </div>

        {/* 설명 */}
        <p className="mb-6 text-sm text-zinc-700">
          평가 결과를 저장할 아이디(이메일)와 비밀번호를 입력해주세요.
        </p>

        {/* 폼 */}
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
              minLength={6}
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

          {/* 버튼 */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={handleSkip}
              disabled={isLoading}
            >
              닫기
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading || !email || !password}
            >
              {isLoading
                ? "처리 중..."
                : isSignUp
                  ? "저장 후 결과 확인"
                  : "로그인 후 결과 확인"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

