/**
 * 공연 작가/작곡가 조회 유틸리티
 * 
 * DB 설계 원칙:
 * - 작가(writer), 작곡가(composer)는 performance에 귀속
 * - performance → performance_person → person 구조로 조회
 * - season을 통한 간접 조회 금지
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

export interface PerformanceCreator {
  id: string;
  name: string;
  role: "writer" | "composer";
}

/**
 * performance 기준으로 작가/작곡가 조회
 * 
 * @param supabase - Supabase 클라이언트 (클라이언트 또는 서버)
 * @param performanceId - 공연 ID
 * @returns 작가/작곡가 목록
 */
export async function getPerformanceCreators(
  supabase: SupabaseClient<Database>,
  performanceId: string
): Promise<PerformanceCreator[]> {
  const { data, error } = await supabase
    .from("performance_person")
    .select(
      `
      id,
      role,
      person:person_id (
        id,
        name
      )
    `
    )
    .eq("performance_id", performanceId)
    .in("role", ["writer", "composer"]);

  if (error) {
    console.error("Failed to load performance creators:", error);
    return [];
  }

  if (!data) return [];

  return data
    .map((item: any) => {
      const person = item.person;
      if (!person) return null;

      return {
        id: item.id,
        name: person.name,
        role: item.role as "writer" | "composer",
      };
    })
    .filter((item): item is PerformanceCreator => item !== null);
}

/**
 * 작가/작곡가 정보를 UI 표시용으로 포맷팅
 */
export function formatCreators(creators: PerformanceCreator[]): {
  writer: string | null;
  composer: string | null;
} {
  const writer = creators.find((c) => c.role === "writer");
  const composer = creators.find((c) => c.role === "composer");

  return {
    writer: writer?.name || null,
    composer: composer?.name || null,
  };
}
