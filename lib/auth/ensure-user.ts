/**
 * public.user_profile 테이블에 사용자가 존재하는지 확인하고, 없으면 생성하는 유틸리티
 */

import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * public.user_profile 테이블에 사용자가 존재하는지 확인하고, 없으면 생성
 * @param supabase Supabase 클라이언트
 * @param userId 사용자 ID (auth.users.id)
 * @param email 사용자 이메일 (선택적)
 */
export async function ensureUserExists(
  supabase: SupabaseClient<Database>,
  userId: string,
  email?: string
): Promise<boolean> {
  try {
    // 먼저 사용자가 존재하는지 확인
    const { data: existingUser, error: checkError } = await supabase
      .from("user_profile")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116은 "no rows returned" 에러이므로 무시
      console.error("Error checking user existence:", checkError);
    }

    if (existingUser) {
      // 사용자가 이미 존재함
      return true;
    }

    // 사용자가 없으면 프로필 생성 (auth.users.id를 기준으로)
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      const insertData: Database["public"]["Tables"]["user_profile"]["Insert"] = {
        id: userId, // auth.users.id
        email: email || "unknown@example.com", // email은 필수
      };
      const { error: insertError } = await supabase
        .from("user_profile")
        .insert(insertData);

      if (!insertError) {
        return true;
      }

      lastError = insertError;
      retries--;

      // 재시도 전 잠시 대기
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.error("Failed to create user profile after retries:", lastError);
    console.error("Error details:", JSON.stringify(lastError, null, 2));
    return false;
  } catch (error) {
    console.error("Error in ensureUserExists:", error);
    return false;
  }
}

