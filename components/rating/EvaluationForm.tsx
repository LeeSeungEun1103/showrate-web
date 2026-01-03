"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDevUserId } from "@/lib/utils/dev-user";
import { normalizeRating } from "@/lib/utils/rating";
import RatingInput from "./RatingInput";
import { Evaluation } from "@/types";
import { useRouter } from "next/navigation";

interface EvaluationFormProps {
  performanceId: string;
  existingEvaluation?: Evaluation | null;
  onSaveSuccess?: () => void;
}

/**
 * 공연 평가 입력 폼 컴포넌트
 * star_rating과 like_rating을 입력받아 저장합니다.
 * MVP 디버깅용: user_id 기반으로 저장
 */
export default function EvaluationForm({
  performanceId,
  existingEvaluation,
  onSaveSuccess,
}: EvaluationFormProps) {
  const router = useRouter();
  const [starRating, setStarRating] = useState<number>(
    existingEvaluation?.star_rating ?? 0.5
  );
  const [likeRating, setLikeRating] = useState<number>(
    existingEvaluation?.like_rating ?? 0.5
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 기존 평가가 있으면 초기값 설정
  useEffect(() => {
    if (existingEvaluation) {
      setStarRating(existingEvaluation.star_rating ?? 0);
      setLikeRating(existingEvaluation.like_rating ?? 0);
    }
  }, [existingEvaluation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus("saving");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const userId = getDevUserId();

      if (!userId) {
        console.error("[Evaluation] Dev user ID not found. Redirecting to login...");
        router.push("/dev/login");
        return;
      }

      console.log("[Evaluation] Starting evaluation save...", {
        performanceId,
        userId,
        starRating,
        likeRating,
        existingEvaluationId: existingEvaluation?.id,
      });

      // Performance의 첫 번째 season을 찾거나, 없으면 생성
      let { data: seasons, error: seasonCheckError } = await supabase
        .from("performance_season")
        .select("id")
        .eq("performance_id", performanceId)
        .limit(1);

      if (seasonCheckError) {
        console.error("[Evaluation] Season check error:", seasonCheckError);
        throw new Error(`시즌 정보 확인 중 오류: ${seasonCheckError.message}`);
      }

      let seasonId: string;
      if (seasons && seasons.length > 0) {
        seasonId = (seasons[0] as any).id;
        console.log("[Evaluation] Found existing season:", seasonId);
      } else {
        // Season이 없으면 기본 venue를 찾아서 season 생성 시도
        const { data: venue, error: venueError } = await supabase
          .from("venue")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (venueError) {
          console.error("[Evaluation] Venue check error:", venueError);
          throw new Error(`공연장 정보 확인 중 오류: ${venueError.message}`);
        }

        if (!venue) {
          throw new Error(
            "공연장 정보가 없어 평가를 저장할 수 없습니다. 관리자에게 문의하세요."
          );
        }

        // 기본 season 생성
        const { data: newSeason, error: seasonError } = await supabase
          .from("performance_season")
          .insert({
            performance_id: performanceId,
            venue_id: (venue as any).id,
          } as any)
          .select("id")
          .single();

        if (seasonError || !newSeason) {
          console.error("[Evaluation] Season creation error:", seasonError);
          throw new Error(
            `평가 저장에 필요한 정보 생성 실패: ${seasonError?.message || "알 수 없는 오류"}`
          );
        }

        seasonId = (newSeason as any).id;
        console.log("[Evaluation] Created new season:", seasonId);
      }

      if (existingEvaluation) {
        // UPDATE
        console.log("[Evaluation] Updating evaluation:", existingEvaluation.id);
        
        // 평가 값을 0.5 단위로 정규화 (DB 제약 조건 만족)
        const normalizedStarRating = normalizeRating(starRating);
        const normalizedLikeRating = normalizeRating(likeRating);
        
        console.log("[Evaluation] Rating values:", {
          original: { starRating, likeRating },
          normalized: { normalizedStarRating, normalizedLikeRating },
        });
        
        const { data, error } = await (supabase
          .from("evaluation") as any)
          .update({
            star_rating: normalizedStarRating,
            like_rating: normalizedLikeRating,
            comment: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingEvaluation.id)
          .select();

        if (error) {
          console.error("[Evaluation] Update error:", error);
          console.error("[Evaluation] Full error object:", JSON.stringify(error, null, 2));
          throw new Error(`평가 수정 실패: ${error.message || JSON.stringify(error)}`);
        }
        console.log("[Evaluation] ✅ Evaluation updated successfully:", data);
      } else {
        // INSERT
        console.log("[Evaluation] Inserting new evaluation...");
        
        // 평가 값을 0.5 단위로 정규화 (DB 제약 조건 만족)
        const normalizedStarRating = normalizeRating(starRating);
        const normalizedLikeRating = normalizeRating(likeRating);
        
        console.log("[Evaluation] Rating values:", {
          original: { starRating, likeRating },
          normalized: { normalizedStarRating, normalizedLikeRating },
        });
        
        const insertData = {
          user_id: userId,
          guest_id: null,
          season_id: seasonId,
          star_rating: normalizedStarRating,
          like_rating: normalizedLikeRating,
          comment: null,
        };
        console.log("[Evaluation] Insert data:", insertData);

        const { data, error } = await supabase
          .from("evaluation")
          .insert(insertData as any)
          .select();

        if (error) {
          console.error("[Evaluation] Insert error:", error);
          console.error("[Evaluation] Full error object:", JSON.stringify(error, null, 2));
          throw new Error(`평가 저장 실패: ${error.message || JSON.stringify(error)}`);
        }
        console.log("[Evaluation] ✅ Evaluation inserted successfully:", data);
      }

      setSaveStatus("success");
      onSaveSuccess?.();

      // 2초 후 상태 초기화
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error: any) {
      console.error("[Evaluation] ❌ Evaluation save error:", error);
      console.error("[Evaluation] Error stack:", error.stack);
      setSaveStatus("error");
      setErrorMessage(
        error.message || "평가 저장 중 오류가 발생했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-8">
        <RatingInput
          label="잘 만들었나요?"
          value={starRating}
          onChange={setStarRating}
          icon="star"
          disabled={isSaving}
        />

        <RatingInput
          label="좋아하나요?"
          value={likeRating}
          onChange={setLikeRating}
          icon="heart"
          disabled={isSaving}
        />
      </div>

      {saveStatus === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">오류가 발생했습니다</p>
          <p className="mt-1">{errorMessage}</p>
          <p className="mt-2 text-xs">
            브라우저 콘솔(F12)을 확인하거나 관리자에게 문의하세요.
          </p>
        </div>
      )}

      {saveStatus === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          평가가 저장되었습니다!
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-lg bg-black px-6 py-4 text-base font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving
          ? "저장 중..."
          : existingEvaluation
          ? "평가 완료"
          : "평가 끝내고 결과 확인하기"}
      </button>
    </form>
  );
}
