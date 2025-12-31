"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setDevUserId, getFixedDevUserId } from "@/lib/utils/dev-user";

/**
 * MVP 디버깅용 임시 로그인 페이지
 * 나중에 Supabase Auth로 교체 예정
 */
export default function DevLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const devUserId = getFixedDevUserId();

      console.log("[Dev Login] Starting login with user ID:", devUserId);

      // User 테이블에 해당 id가 없으면 생성
      const { data: existingUser, error: checkError } = await supabase
        .from("user")
        .select("id")
        .eq("id", devUserId)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("[Dev Login] User check error:", checkError);
        throw new Error(`사용자 확인 중 오류: ${checkError.message}`);
      }

      if (!existingUser) {
        console.log("[Dev Login] User not found, creating new user...");
        const { error: createError } = await supabase
          .from("user")
          .insert({
            id: devUserId,
            email: "dev@test.com",
            password_hash: "dev_password_hash", // 임시값
          } as any);

        if (createError) {
          console.error("[Dev Login] User creation error:", createError);
          throw new Error(`사용자 생성 중 오류: ${createError.message}`);
        }
        console.log("[Dev Login] User created successfully");
      } else {
        console.log("[Dev Login] User already exists");
      }

      // localStorage에 저장
      setDevUserId();
      console.log("[Dev Login] Dev user ID saved to localStorage");

      // 홈으로 리다이렉트
      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("[Dev Login] Error:", err);
      setError(err.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-zinc-200 bg-white p-8">
        <div>
          <h1 className="text-2xl font-bold text-black">임시 로그인</h1>
          <p className="mt-2 text-sm text-zinc-600">
            MVP 디버깅용 테스트 계정입니다.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full rounded-lg bg-black px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "처리 중..." : "테스트 계정으로 시작하기"}
        </button>

        <div className="text-xs text-zinc-500">
          <p>• 고정된 테스트 UUID를 사용합니다</p>
          <p>• Supabase user 테이블에 자동으로 생성됩니다</p>
          <p>• 모든 평가는 이 계정으로 저장됩니다</p>
        </div>
      </div>
    </div>
  );
}

