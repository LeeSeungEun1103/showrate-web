/**
 * public.guest 테이블에 Guest가 존재하는지 확인하고, 없으면 생성하는 유틸리티
 */

import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * public.guest 테이블에 Guest가 존재하는지 확인하고, 없으면 생성
 * @param supabase Supabase 클라이언트
 * @param guestId Guest ID
 */
export async function ensureGuestExists(
  supabase: SupabaseClient<Database>,
  guestId: string
): Promise<boolean> {
  try {
    // 먼저 Guest가 존재하는지 확인
    const { data: existingGuest, error: checkError } = await supabase
      .from("guest")
      .select("id")
      .eq("id", guestId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116은 "no rows returned" 에러이므로 무시
      console.error("Error checking guest existence:", checkError);
    }

    if (existingGuest) {
      // Guest가 이미 존재함
      return true;
    }

    // Guest가 없으면 생성
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      const { error: insertError } = await supabase
        .from("guest")
        .insert({
          id: guestId,
        });

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

    console.error("Failed to create guest after retries:", lastError);
    console.error("Error details:", JSON.stringify(lastError, null, 2));
    return false;
  } catch (error) {
    console.error("Error in ensureGuestExists:", error);
    return false;
  }
}

