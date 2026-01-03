"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth/auth";
import { normalizeRating } from "@/lib/utils/rating";
import RatingInput from "@/components/rating/RatingInput";
import { Database } from "@/types/database";
import { EvaluationUpdate, EvaluationRow, PerformanceRow } from "@/types/supabase";
import { getPerformanceCreators, formatCreators } from "@/lib/utils/performance-creators";
import CreatorInfo from "@/components/performance/CreatorInfo";
import Button from "@/components/ui/Button";
import Image from "next/image";
import Toast from "@/components/ui/Toast";
import { ArrowLeft } from "lucide-react";

/**
 * 내 평가 수정 화면
 * - 선택한 공연의 평가를 수정할 수 있음
 * - 평가 입력 화면과 유사한 UI
 */
export default function EditEvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const evaluationId = params.evaluationId as string;

  const [evaluation, setEvaluation] = useState<EvaluationRow | null>(null);
  const [performance, setPerformance] = useState<PerformanceRow | null>(null);
  const [starRating, setStarRating] = useState(0);
  const [likeRating, setLikeRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [creators, setCreators] = useState<{ writer: string | null; composer: string | null }>({
    writer: null,
    composer: null,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // 사용자 인증 확인
  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id.substring(0, 8));
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    async function loadEvaluation() {
      const user = await getCurrentUser();
      if (!user) {
        return;
      }
      const currentUserId = user.id;

      try {
        const supabase = createClient();
        
        // 평가 정보 조회
        // .single<EvaluationRow>()로 명시적 타입 지정하여 never 타입 방지
        const { data: evaluationData, error: evalError } = await supabase
          .from("evaluation")
          .select("*")
          .eq("id", evaluationId)
          .eq("user_id", currentUserId)
          .single<EvaluationRow>();

        if (evalError) throw evalError;
        if (!evaluationData) {
          router.push("/my-evaluations");
          return;
        }

        // Supabase에서 반환된 데이터를 직접 사용 (타입 안전)
        setEvaluation(evaluationData);
        setStarRating(evaluationData.star_rating ?? 0);
        setLikeRating(evaluationData.like_rating ?? 0);

        // Performance 정보 조회 (performance_id 직접 사용)
        const performanceId = evaluationData.performance_id;
        if (!performanceId) {
          router.push("/my-evaluations");
          return;
        }

        // Load performance data - poster_url from performance table only
        const { data: performanceData, error: perfError } = await supabase
          .from("performance")
          .select("*")
          .eq("id", performanceId)
          .single<PerformanceRow>();

        if (perfError) throw perfError;
        if (!performanceData) {
          router.push("/my-evaluations");
          return;
        }

        // Supabase에서 반환된 데이터를 직접 사용 (타입 안전)
        setPerformance(performanceData);

        // 포스터 URL 로드: performance.poster_url만 사용 (null 허용)
        setPosterUrl(performanceData.poster_url);

        // 작가/작곡가 정보 로드
        const creatorsList = await getPerformanceCreators(supabase, performanceId);
        setCreators(formatCreators(creatorsList));
      } catch (error) {
        console.error("Failed to load evaluation:", error);
        router.push("/my-evaluations");
      } finally {
        setIsLoading(false);
      }
    }

    loadEvaluation();
  }, [evaluationId, router]);

  const handleSave = async () => {
    if (!evaluation) return;

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const supabase = createClient();
      const normalizedStar = normalizeRating(starRating);
      const normalizedLike = normalizeRating(likeRating);

      // EvaluationUpdate 타입으로 명시적 지정 (never 타입 방지)
      const updateData: EvaluationUpdate = {
        star_rating: normalizedStar,
        like_rating: normalizedLike,
        updated_at: new Date().toISOString(),
      };

      // Supabase의 타입 추론 문제 해결
      // updateData는 이미 EvaluationUpdate 타입으로 지정되어 있음
      // @supabase/ssr의 createBrowserClient가 타입을 제대로 추론하지 못하는 경우,
      // 명시적으로 타입을 지정해야 합니다
      type EvaluationTable = Database["public"]["Tables"]["evaluation"];
      const { error } = await (supabase
        .from("evaluation") as unknown as {
          update: (values: EvaluationTable["Update"]) => {
            eq: (column: string, value: string) => Promise<{ error: any }>;
          };
        })
        .update(updateData)
        .eq("id", evaluation.id);

      if (error) throw error;

      setSaveStatus("success");
      setTimeout(() => {
        router.push("/my-evaluations");
      }, 1000);
    } catch (error) {
      console.error("Failed to save evaluation:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotSeen = async () => {
    if (!evaluation) return;

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const supabase = createClient();
      
      // 평가 삭제
      const { error } = await supabase
        .from("evaluation")
        .delete()
        .eq("id", evaluation.id);

      if (error) throw error;

      // 토스트 알림 표시
      setShowToast(true);
      
      // 약간의 딜레이 후 내 평가 화면으로 이동
      setTimeout(() => {
        router.push("/my-evaluations");
      }, 1500);
    } catch (error) {
      console.error("Failed to delete evaluation:", error);
      setSaveStatus("error");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-600">로딩 중...</p>
      </div>
    );
  }

  if (!evaluation || !performance) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 ID 표시 */}
      {userId && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-sm text-zinc-600">ID: {userId}</p>
        </div>
      )}

      {/* 뒤로가기 버튼 */}
      <div className="px-4 pt-2 pb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          뒤로
        </button>
      </div>

      {/* 포스터 이미지 */}
      <div className="mb-6 px-4 flex justify-center">
        <div className="w-full max-w-sm">
          <PosterImage posterUrl={posterUrl} title={performance.title} />
        </div>
      </div>

      {/* 평가 입력 영역 */}
      <div className="px-4 pb-24">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-2 text-2xl font-bold text-black">{performance.title}</h1>
          
          {/* 극본/작곡 정보 */}
          <div className="mb-6 flex justify-center">
            <CreatorInfo
              writer={creators.writer}
              composer={creators.composer}
            />
          </div>

          <div className="space-y-6">
            <div className="flex justify-center">
              <RatingInput
                label="잘 만들었나요?"
                value={starRating}
                onChange={setStarRating}
                icon="star"
                disabled={isSaving}
              />
            </div>

            <div className="flex justify-center">
              <RatingInput
                label="좋아하나요?"
                value={likeRating}
                onChange={setLikeRating}
                icon="heart"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* 안봤어요 버튼 */}
          <button
            onClick={handleNotSeen}
            className="mt-4 text-sm text-zinc-500 hover:text-zinc-700"
            disabled={isSaving}
          >
            안봤어요
          </button>

          {saveStatus === "error" && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              저장 중 오류가 발생했습니다.
            </div>
          )}

          {saveStatus === "success" && (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              저장되었습니다!
            </div>
          )}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white p-4">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleSave}
          disabled={isSaving || starRating === 0 || likeRating === 0}
        >
          {isSaving ? "저장 중..." : "평가 완료"}
        </Button>
      </div>

      {/* 토스트 알림 */}
      <Toast
        message="공연 평가가 삭제되었습니다"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}

function PosterImage({
  posterUrl,
  title,
}: {
  posterUrl: string | null;
  title: string;
}) {
  return (
    <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-zinc-200">
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={title}
          width={400}
          height={600}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
          <svg
            className="h-24 w-24 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
