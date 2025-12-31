"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Performance } from "@/types";
import Link from "next/link";
import GlobalNav from "@/components/layout/GlobalNav";
import { getDevUserId } from "@/lib/utils/dev-user";
import { getPerformanceCreators, formatCreators } from "@/lib/utils/performance-creators";

interface PerformanceWithStats extends Performance {
  evaluation_count: number;
  avg_star_rating: number | null;
  avg_like_rating: number | null;
  writer: string | null;
  composer: string | null;
  poster_url: string | null;
}

type SortType = "star_high" | "heart_high" | "star_low_heart_high" | "star_high_heart_low";

export default function HomePage() {
  const [performances, setPerformances] = useState<PerformanceWithStats[]>([]);
  const [filteredPerformances, setFilteredPerformances] = useState<PerformanceWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>("star_high");
  const [userId, setUserId] = useState<string | null>(null);

  // 사용자 ID 로드
  useEffect(() => {
    const id = getDevUserId();
    setUserId(id ? id.substring(0, 8) : null);
  }, []);

  // 공연 목록 로드
  useEffect(() => {
    async function loadPerformances() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("performance")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;

        // 각 공연의 평가 통계 계산
        const performancesWithStats: PerformanceWithStats[] = await Promise.all(
          (data || []).map(async (performance) => {
            const perfTyped = performance as any;
            
            // 포스터 URL 로드: performance.poster_url 우선, 없으면 performance_season.poster_url
            let posterUrl: string | null = null;
            if (perfTyped.poster_url) {
              posterUrl = perfTyped.poster_url;
            } else {
              const { data: seasons } = await supabase
                .from("performance_season")
                .select("poster_url")
                .eq("performance_id", perfTyped.id)
                .limit(1);
              posterUrl = seasons?.[0]?.poster_url || null;
            }
            
            // 해당 공연의 season 찾기
            const { data: seasons } = await supabase
              .from("performance_season")
              .select("id")
              .eq("performance_id", perfTyped.id);

            const seasonIds = seasons?.map((s) => (s as any).id) || [];

            if (seasonIds.length === 0) {
              // 작가/작곡가 정보 조회
              const creatorsList = await getPerformanceCreators(supabase, perfTyped.id);
              const creators = formatCreators(creatorsList);
              
              return {
                ...perfTyped,
                evaluation_count: 0,
                avg_star_rating: null,
                avg_like_rating: null,
                writer: creators.writer,
                composer: creators.composer,
                poster_url: posterUrl,
              };
            }

            // 평가 통계 계산 (performance_id 기준, season 무시)
            const { data: evaluations } = await supabase
              .from("evaluation")
              .select("star_rating, like_rating")
              .eq("performance_id", perfTyped.id);

            const count = evaluations?.length || 0;
            const evaluationsTyped = (evaluations || []) as any[];
            const avgStar =
              count > 0
                ? evaluationsTyped.reduce((sum, e) => sum + e.star_rating, 0) / count
                : null;
            const avgLike =
              count > 0
                ? evaluationsTyped.reduce((sum, e) => sum + e.like_rating, 0) / count
                : null;

            // 작가/작곡가 정보 조회
            const creatorsList = await getPerformanceCreators(supabase, perfTyped.id);
            const creators = formatCreators(creatorsList);

            return {
              ...perfTyped,
              evaluation_count: count,
              avg_star_rating: avgStar,
              avg_like_rating: avgLike,
              writer: creators.writer,
              composer: creators.composer,
              poster_url: posterUrl,
            };
          })
        );

        setPerformances(performancesWithStats);
        setFilteredPerformances(performancesWithStats);
      } catch (error) {
        console.error("Error fetching performances:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPerformances();
  }, []);

  // 검색 및 정렬 적용
  useEffect(() => {
    let filtered = [...performances];

    // 검색 필터
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      );
    }

    // 정렬
    // 평가 개수가 0개인 공연은 항상 아래쪽에 배치
    filtered.sort((a, b) => {
      const aHasEvaluations = a.evaluation_count > 0;
      const bHasEvaluations = b.evaluation_count > 0;

      // 평가 개수가 0개인 공연은 항상 아래쪽
      if (!aHasEvaluations && bHasEvaluations) return 1;
      if (aHasEvaluations && !bHasEvaluations) return -1;
      if (!aHasEvaluations && !bHasEvaluations) return 0; // 둘 다 평가 없으면 순서 유지

      // 둘 다 평가가 있는 경우에만 정렬 로직 적용
      switch (sortType) {
        case "star_high": {
          const starA = a.avg_star_rating ?? 0;
          const starB = b.avg_star_rating ?? 0;
          if (starB !== starA) return starB - starA;
          // 점수가 같으면 평가 개수가 많은 순
          return b.evaluation_count - a.evaluation_count;
        }
        
        case "heart_high": {
          const heartA = a.avg_like_rating ?? 0;
          const heartB = b.avg_like_rating ?? 0;
          if (heartB !== heartA) return heartB - heartA;
          // 점수가 같으면 평가 개수가 많은 순
          return b.evaluation_count - a.evaluation_count;
        }
        
        case "star_low_heart_high": {
          const starLowA = a.avg_star_rating ?? 0;
          const starLowB = b.avg_star_rating ?? 0;
          const heartHighA = a.avg_like_rating ?? 0;
          const heartHighB = b.avg_like_rating ?? 0;
          const diffA = heartHighA - starLowA;
          const diffB = heartHighB - starLowB;
          if (diffB !== diffA) return diffB - diffA;
          // 차이가 같으면 평가 개수가 많은 순
          return b.evaluation_count - a.evaluation_count;
        }
        
        case "star_high_heart_low": {
          const starHighA = a.avg_star_rating ?? 0;
          const starHighB = b.avg_star_rating ?? 0;
          const heartLowA = a.avg_like_rating ?? 0;
          const heartLowB = b.avg_like_rating ?? 0;
          const diffHighA = starHighA - heartLowA;
          const diffHighB = starHighB - heartLowB;
          if (diffHighB !== diffHighA) return diffHighB - diffHighA;
          // 차이가 같으면 평가 개수가 많은 순
          return b.evaluation_count - a.evaluation_count;
        }
        
        default:
          return 0;
      }
    });

    setFilteredPerformances(filtered);
  }, [performances, searchQuery, sortType]);

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
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {userId && (
              <p className="text-sm text-zinc-600">ID: {userId}</p>
            )}
            <h1 className="text-2xl font-bold text-black">전체 평가</h1>
            <div className="w-16" /> {/* 공간 맞추기 */}
          </div>
        </div>

        {/* 검색 바 */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Q 공연 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 pl-10 text-sm focus:border-zinc-500 focus:outline-none"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* 정렬 버튼 */}
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setSortType("star_high")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              sortType === "star_high"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            <span>★</span>
            <span>↑</span>
          </button>
          <button
            onClick={() => setSortType("heart_high")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              sortType === "heart_high"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            <span>♥</span>
            <span>↑</span>
          </button>
          <button
            onClick={() => setSortType("star_low_heart_high")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              sortType === "star_low_heart_high"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            <span>★</span>
            <span>↓</span>
            <span>♥</span>
            <span>↑</span>
          </button>
          <button
            onClick={() => setSortType("star_high_heart_low")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              sortType === "star_high_heart_low"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            <span>★</span>
            <span>↑</span>
            <span>♥</span>
            <span>↓</span>
          </button>
        </div>

        {/* 공연 목록 */}
        {filteredPerformances.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
            <p className="text-zinc-600">
              {searchQuery ? "검색 결과가 없습니다." : "아직 등록된 공연이 없습니다."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPerformances.map((performance, index) => (
              <PerformanceCard
                key={performance.id}
                performance={performance}
                index={index + 1}
              />
            ))}
          </div>
        )}

        {/* 평가하기 버튼 */}
        <div className="mt-8">
          <Link
            href="/evaluate"
            className="block w-full rounded-lg bg-black px-6 py-4 text-center text-base font-medium text-white transition-colors hover:bg-zinc-800"
          >
            공연 평가하기
          </Link>
        </div>
      </main>
      <GlobalNav />
    </div>
  );
}

function PerformanceCard({
  performance,
  index,
}: {
  performance: PerformanceWithStats;
  index: number;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="text-sm font-medium text-zinc-400">{index}</span>
        {/* 포스터 이미지 */}
        <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-zinc-200">
          {performance.poster_url ? (
            <img
              src={performance.poster_url}
              alt={performance.title}
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
          <h2 className="text-lg font-semibold text-black">{performance.title}</h2>
          {/* 작가/작곡가 정보 */}
          {(performance.writer || performance.composer) && (
            <div className="mt-1 flex gap-2">
              {performance.writer && (
                <span className="text-xs text-zinc-500">극본: {performance.writer}</span>
              )}
              {performance.composer && (
                <span className="text-xs text-zinc-500">작곡: {performance.composer}</span>
              )}
            </div>
          )}
          {performance.description && (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
              {performance.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
            <span>평가 {performance.evaluation_count}개</span>
            {performance.avg_star_rating !== null && (
              <span className="flex items-center gap-1">
                <span className="text-yellow-400">⭐</span>
                <span>{performance.avg_star_rating.toFixed(1)}</span>
              </span>
            )}
            {performance.avg_like_rating !== null && (
              <span className="flex items-center gap-1">
                <span className="text-red-400">❤️</span>
                <span>
                  {performance.avg_like_rating.toFixed(1)} ({performance.evaluation_count}명)
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
