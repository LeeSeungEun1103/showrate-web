"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getDevUserId } from "@/lib/utils/dev-user";
import { Database } from "@/types/database";
import { Performance, Evaluation } from "@/types";
import GlobalNav from "@/components/layout/GlobalNav";
import Header from "@/components/layout/Header";
import StatsBanner from "@/components/layout/StatsBanner";
import SearchInput from "@/components/ui/SearchInput";
import FilterButton from "@/components/ui/FilterButton";
import Card from "@/components/ui/Card";
import { getPerformanceCreators, formatCreators } from "@/lib/utils/performance-creators";
import { Star, Heart, Pencil, Plus } from "lucide-react";
import RatingDisplay from "@/components/ui/RatingDisplay";
import { cn } from "@/lib/utils/cn";

interface EvaluationWithPerformance extends Evaluation {
  performance: Performance;
  writer: string | null;
  composer: string | null;
}

type SortType = "star_high" | "heart_high" | "star_low_heart_high" | "star_high_heart_low";

/**
 * 내 평가 화면
 * - 평가한 공연 리스트
 * - 각 공연의 별점/하트 표시
 * - 클릭 시 수정 화면으로 이동
 * - 검색 및 정렬 기능
 */
export default function MyEvaluationsPage() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<
    EvaluationWithPerformance[]
  >([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<
    EvaluationWithPerformance[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>("star_high");
  const [userId, setUserId] = useState<string | null>(null);

  // 사용자 ID 로드
  useEffect(() => {
    const id = getDevUserId();
    setUserId(id ? id.substring(0, 8) : null);
    if (!id) {
      router.push("/dev/login");
      return;
    }
  }, [router]);

  useEffect(() => {
    async function loadEvaluations() {
      const currentUserId = getDevUserId();
      if (!currentUserId) {
        return;
      }

      try {
        const supabase = createClient();

        // 사용자의 모든 평가 조회
        const { data: evaluationsData, error } = await supabase
          .from("evaluation")
          .select("*")
          .eq("user_id", currentUserId)
          .order("updated_at", { ascending: false });

        if (error) throw error;

        // 각 평가의 공연 정보 조회
        // performance_id 기준으로 중복 제거 (같은 performance는 하나만 표시)
        const performanceMap = new Map<string, EvaluationWithPerformance>();

        for (const evaluation of evaluationsData || []) {
          const evalTyped = evaluation as any;
          const performanceId = evalTyped.performance_id;

          // performance_id가 없으면 건너뛰기
          if (!performanceId) continue;

          // 이미 같은 performance_id의 평가가 있고, 현재 평가가 더 최근이면 업데이트
          const existing = performanceMap.get(performanceId);
          if (existing) {
            const existingDate = new Date(existing.updated_at || existing.created_at);
            const currentDate = new Date(evalTyped.updated_at || evalTyped.created_at);
            if (currentDate > existingDate) {
              // 더 최근 평가로 교체
              const { data: performance } = await supabase
                .from("performance")
                .select("*")
                .eq("id", performanceId)
                .single<Database["public"]["Tables"]["performance"]["Row"]>();

              if (performance) {
                const creatorsList = await getPerformanceCreators(supabase, performanceId);
                const creators = formatCreators(creatorsList);
                
                performanceMap.set(performanceId, {
                  ...evalTyped,
                  performance,
                  writer: creators.writer,
                  composer: creators.composer,
                });
              }
            }
          } else {
            // 새로운 performance_id
            const { data: performance } = await supabase
              .from("performance")
              .select("*")
              .eq("id", performanceId)
              .single<Database["public"]["Tables"]["performance"]["Row"]>();

            if (performance) {
              // 작가/작곡가 정보 조회
              const creatorsList = await getPerformanceCreators(supabase, performanceId);
              const creators = formatCreators(creatorsList);
              
              performanceMap.set(performanceId, {
                ...evalTyped,
                performance,
                writer: creators.writer,
                composer: creators.composer,
              });
            }
          }
        }

        const evaluationsWithPerformance = Array.from(performanceMap.values());

        setEvaluations(evaluationsWithPerformance);
        setFilteredEvaluations(evaluationsWithPerformance);
      } catch (error) {
        console.error("Failed to load evaluations:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadEvaluations();
  }, [router]);

  // 검색 및 정렬 적용
  useEffect(() => {
    let filtered = [...evaluations];

    // 검색 필터
    if (searchQuery.trim()) {
      filtered = filtered.filter((e) =>
        e.performance.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.performance.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortType) {
        case "star_high":
          return b.star_rating - a.star_rating;
        
        case "heart_high":
          return b.like_rating - a.like_rating;
        
        case "star_low_heart_high":
          const diffA = a.like_rating - a.star_rating;
          const diffB = b.like_rating - b.star_rating;
          return diffB - diffA;
        
        case "star_high_heart_low":
          const diffHighA = a.star_rating - a.like_rating;
          const diffHighB = b.star_rating - b.like_rating;
          return diffHighB - diffHighA;
        
        default:
          return 0;
      }
    });

    setFilteredEvaluations(filtered);
  }, [evaluations, searchQuery, sortType]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <main className="mx-auto max-w-md px-4 py-6">
        {/* 헤더 */}
        <Header
          userId={userId || undefined}
          title="ShowRate"
          showLogout={false}
        />

        {/* 통계 배너 */}
        {userId && (
          <StatsBanner
            rank="상위 3%"
            count={evaluations.length}
            userName={userId}
            className="mb-6"
          />
        )}

        {/* 검색 바 */}
        <div className="mb-4">
          <SearchInput
            placeholder="공연 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 정렬 버튼 */}
        <div className="mb-4 flex items-center gap-2">
          <FilterButton
            active={sortType === "star_high"}
            star="up"
            onClick={() => setSortType("star_high")}
          />
          <FilterButton
            active={sortType === "heart_high"}
            heart="up"
            onClick={() => setSortType("heart_high")}
          />
          <FilterButton
            active={sortType === "star_low_heart_high"}
            star="down"
            heart="up"
            onClick={() => setSortType("star_low_heart_high")}
          />
          <FilterButton
            active={sortType === "star_high_heart_low"}
            star="up"
            heart="down"
            onClick={() => setSortType("star_high_heart_low")}
          />
        </div>

        {/* 평가 목록 */}
        {filteredEvaluations.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
            <p className="text-zinc-600">
              {searchQuery ? "검색 결과가 없습니다." : "아직 평가한 공연이 없습니다."}
            </p>
            {!searchQuery && (
              <Link
                href="/evaluate"
                className="mt-4 inline-block rounded-lg bg-black px-6 py-3 text-sm font-medium text-white"
              >
                공연 평가하기
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvaluations.map((evaluation, index) => (
              <Link
                key={evaluation.id}
                href={`/my-evaluations/${evaluation.id}/edit`}
                className="block"
              >
                <div className="border-b border-zinc-100 py-4 first:pt-0">
                  <div className="flex items-start gap-3">
                    <span className={cn(
                      "text-lg font-bold",
                      index < 3 ? "text-rose-500" : "text-zinc-400"
                    )}>
                      {index + 1}
                    </span>
                  {/* 포스터 이미지 */}
                  <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-zinc-200">
                    {evaluation.performance.poster_url ? (
                      <img
                        src={evaluation.performance.poster_url}
                        alt={evaluation.performance.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
                        <svg
                          className="h-8 w-8 text-zinc-400"
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
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-black">
                      {evaluation.performance.title}
                    </h2>
                    {/* 작가/작곡가 정보 */}
                    {(evaluation.writer || evaluation.composer) && (
                      <div className="mt-1 flex gap-2">
                        {evaluation.writer && (
                          <span className="text-xs text-zinc-500">극본: {evaluation.writer}</span>
                        )}
                        {evaluation.composer && (
                          <span className="text-xs text-zinc-500">작곡: {evaluation.composer}</span>
                        )}
                      </div>
                    )}
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <RatingDisplay type="star" value={evaluation.star_rating} size="md" showNumber={true} />
                        <Pencil className="h-4 w-4 text-zinc-400" />
                      </div>
                      <RatingDisplay type="heart" value={evaluation.like_rating} size="md" showNumber={true} />
                    </div>
                  </div>
                </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <GlobalNav />
      
      {/* 플로팅 평가하기 버튼 */}
      <Link
        href="/evaluate"
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
        aria-label="공연 평가하기"
      >
        <Plus className="h-5 w-5" />
        <span>공연 평가하기</span>
      </Link>
    </div>
  );
}
