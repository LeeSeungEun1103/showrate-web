"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Performance } from "@/types";
import Link from "next/link";
import GlobalNav from "@/components/layout/GlobalNav";
import Header from "@/components/layout/Header";
import SearchInput from "@/components/ui/SearchInput";
import FilterButton from "@/components/ui/FilterButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth/auth";
import { signOut } from "@/lib/auth/auth";
import { getPerformanceCreators, formatCreators } from "@/lib/utils/performance-creators";
import LoginModal from "@/components/auth/LoginModal";
import Toast from "@/components/ui/Toast";
import { Star, Heart, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

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
  const router = useRouter();
  const [performances, setPerformances] = useState<PerformanceWithStats[]>([]);
  const [filteredPerformances, setFilteredPerformances] = useState<PerformanceWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>("star_high");
  const [userId, setUserId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // 사용자 인증 상태 확인 (선택적)
  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (user) {
        setUserId(user.id.substring(0, 8));
      }
    }
    checkAuth();
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
            
            // 포스터 URL 로드: performance.poster_url만 사용
            const posterUrl: string | null = perfTyped.poster_url ?? null;

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
        <Header
          userId={userId || undefined}
          title="ShowRate"
          showLogout={!!userId}
          showLogin={!userId}
          onLogout={async () => {
            await signOut();
            setUserId(null);
            setShowToast(true);
            router.refresh();
          }}
          onLogin={() => {
            setShowLoginModal(true);
          }}
        />

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

      {/* 로그인 모달 */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
          }}
          onSuccess={() => {
            setShowLoginModal(false);
            // 인증 상태 다시 확인
            async function refreshAuth() {
              const user = await getCurrentUser();
              if (user) {
                setUserId(user.id.substring(0, 8));
              }
            }
            refreshAuth();
            router.refresh();
          }}
        />
      )}

      {/* 토스트 알림 */}
      <Toast
        message="로그아웃 되었습니다"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
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
  const isTopThree = index <= 3;
  
  return (
    <div className="border-b border-zinc-100 py-4 first:pt-0">
      <div className="flex items-start gap-3">
        <span className={cn(
          "text-lg font-bold",
          isTopThree ? "text-rose-500" : "text-zinc-400"
        )}>
          {index}
        </span>
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
          <div className="mt-3 flex items-center gap-4">
            <span className="text-xs text-zinc-500">평균</span>
            {performance.avg_star_rating !== null && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-base font-bold text-black">
                  {performance.avg_star_rating.toFixed(1)}
                </span>
              </span>
            )}
            {performance.avg_like_rating !== null && (
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                <span className="text-base font-bold text-black">
                  {performance.avg_like_rating.toFixed(1)}
                </span>
                <span className="text-xs text-zinc-500">
                  ({performance.evaluation_count}명)
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
