"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDevUserId } from "@/lib/utils/dev-user";
import EvaluationForm from "./EvaluationForm";
import { Evaluation } from "@/types";

interface EvaluationFormLoaderProps {
  performanceId: string;
}

/**
 * 평가 폼 로더 컴포넌트
 * 기존 평가를 조회하여 EvaluationForm에 전달합니다.
 * MVP 디버깅용: user_id 기반으로 조회
 */
export default function EvaluationFormLoader({
  performanceId,
}: EvaluationFormLoaderProps) {
  const [existingEvaluation, setExistingEvaluation] =
    useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadEvaluation() {
      try {
        const supabase = createClient();
        const userId = getDevUserId();

        if (!userId) {
          console.log("[EvaluationLoader] Dev user ID not found");
          setIsLoading(false);
          return;
        }

        console.log("[EvaluationLoader] Loading evaluation for user:", userId);

        // Performance의 season을 찾아서 evaluation 조회
        const { data: seasons, error: seasonError } = await supabase
          .from("performance_season")
          .select("id")
          .eq("performance_id", performanceId)
          .limit(1);

        if (seasonError) {
          console.error("[EvaluationLoader] Season check error:", seasonError);
          setIsLoading(false);
          return;
        }

        if (!seasons || seasons.length === 0) {
          console.log("[EvaluationLoader] No season found for performance");
          setIsLoading(false);
          return;
        }

        const seasonId = (seasons[0] as any).id;
        console.log("[EvaluationLoader] Found season:", seasonId);

        // User ID로 평가 조회
        const { data, error } = await supabase
          .from("evaluation")
          .select("*")
          .eq("user_id", userId)
          .eq("season_id", seasonId)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          // PGRST116은 "no rows returned" 에러이므로 무시
          console.error("[EvaluationLoader] Evaluation load error:", error);
        } else if (data) {
          console.log("[EvaluationLoader] Found existing evaluation:", data);
        } else {
          console.log("[EvaluationLoader] No existing evaluation found");
        }

        setExistingEvaluation(data || null);
      } catch (error) {
        console.error("[EvaluationLoader] Failed to load evaluation:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadEvaluation();
  }, [performanceId, refreshKey]);

  const handleSaveSuccess = () => {
    // 저장 성공 후 평가 다시 로드
    console.log("[EvaluationLoader] Save success, reloading evaluation...");
    setRefreshKey((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-zinc-600">
          평가 정보를 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <EvaluationForm
      performanceId={performanceId}
      existingEvaluation={existingEvaluation}
      onSaveSuccess={handleSaveSuccess}
    />
  );
}
