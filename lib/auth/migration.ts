/**
 * Guest 평가를 User 평가로 마이그레이션하는 유틸리티
 */

import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Guest ID로 저장된 모든 평가를 User ID로 마이그레이션
 * @param supabase Supabase 클라이언트
 * @param guestId 기존 Guest ID
 * @param userId 새로운 User ID
 */
export async function migrateGuestEvaluationsToUser(
  supabase: SupabaseClient<Database>,
  guestId: string,
  userId: string
): Promise<{ migrated: number; errors: number }> {
  try {
    // Guest ID로 저장된 모든 평가 조회
    const { data: guestEvaluations, error: fetchError } = await supabase
      .from("evaluation")
      .select("id, performance_id")
      .eq("guest_id", guestId)
      .is("user_id", null);

    if (fetchError) {
      console.error("Failed to fetch guest evaluations:", fetchError);
      return { migrated: 0, errors: 0 };
    }

    if (!guestEvaluations || guestEvaluations.length === 0) {
      return { migrated: 0, errors: 0 };
    }

    let migrated = 0;
    let errors = 0;

    // 각 평가를 User ID로 업데이트
    // 같은 performance_id에 대한 평가가 이미 존재하는 경우는 건너뛰기
    for (const evaluation of guestEvaluations) {
      try {
        // 이미 해당 performance_id에 대한 user 평가가 있는지 확인
        const { data: existingEval } = await supabase
          .from("evaluation")
          .select("id")
          .eq("user_id", userId)
          .eq("performance_id", evaluation.performance_id ?? "")
          .limit(1)
          .maybeSingle();

        if (existingEval) {
          // 이미 존재하는 평가는 삭제 (guest 평가를 삭제)
          await supabase
            .from("evaluation")
            .delete()
            .eq("id", evaluation.id);
        } else {
          // Guest 평가를 User 평가로 업데이트
          const { error: updateError } = await supabase
            .from("evaluation")
            .update({
              user_id: userId,
              guest_id: null,
            })
            .eq("id", evaluation.id);

          if (updateError) {
            console.error(
              `Failed to migrate evaluation ${evaluation.id}:`,
              updateError
            );
            errors++;
          } else {
            migrated++;
          }
        }
      } catch (error) {
        console.error(
          `Error migrating evaluation ${evaluation.id}:`,
          error
        );
        errors++;
      }
    }

    return { migrated, errors };
  } catch (error) {
    console.error("Failed to migrate guest evaluations:", error);
    return { migrated: 0, errors: 0 };
  }
}

