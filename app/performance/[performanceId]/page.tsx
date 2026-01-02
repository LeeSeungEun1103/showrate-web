import { createClient } from "@/lib/supabase/server";
import { Performance } from "@/types";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import EvaluationFormLoader from "@/components/rating/EvaluationFormLoader";
import { getPerformanceCreators, formatCreators } from "@/lib/utils/performance-creators";
import CreatorInfo from "@/components/performance/CreatorInfo";

interface PageProps {
  params: Promise<{ performanceId: string }>;
}

/**
 * 공연 상세 페이지
 * - 공연 정보 표시
 * - 평가 입력/수정 기능
 */
export default async function PerformanceDetailPage({
  params,
}: PageProps) {
  const { performanceId } = await params;
  const supabase = await createClient();

  // 공연 정보 조회
  const { data: performance, error: performanceError } = await supabase
    .from("performance")
    .select("*")
    .eq("id", performanceId)
    .single();

  if (performanceError || !performance) {
    notFound();
  }

  const performanceTyped = performance as Performance;

  // 포스터 이미지 URL: performance.poster_url만 사용
  const posterUrl: string | null = performanceTyped.poster_url ?? null;

  // 작가/작곡가 정보 조회
  const creatorsList = await getPerformanceCreators(supabase, performanceId);
  const creators = formatCreators(creatorsList);

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-md px-4 py-6">
        {/* 뒤로가기 버튼 */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900"
        >
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          목록으로
        </Link>

        {/* 공연 정보 */}
        <div className="mb-8">
          {/* 포스터 */}
          <div className="mb-6 aspect-[2/3] w-full overflow-hidden rounded-lg bg-zinc-200">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={performanceTyped.title}
                width={400}
                height={600}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-100">
                <svg
                  className="h-24 w-24 text-zinc-300"
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

          {/* 제목 */}
          <h1 className="mb-2 text-2xl font-bold text-black">
            {performanceTyped.title}
          </h1>
          
          {/* 극본/작곡 정보 */}
          <div className="mb-4">
            <CreatorInfo
              writer={creators.writer}
              composer={creators.composer}
            />
          </div>

          {performanceTyped.description && (
            <p className="text-sm leading-relaxed text-zinc-600">
              {performanceTyped.description}
            </p>
          )}
        </div>

        {/* 평가 영역 */}
        <div className="mb-8">
          <EvaluationFormLoader performanceId={performanceId} />
        </div>
      </main>
    </div>
  );
}
