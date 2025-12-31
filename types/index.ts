/**
 * 애플리케이션에서 사용할 공통 타입 정의
 */

import { Database } from "./database";

// 테이블 타입 별칭 (사용 편의성을 위해)
export type User = Database["public"]["Tables"]["user"]["Row"];
export type Guest = Database["public"]["Tables"]["guest"]["Row"];
export type Performance = Database["public"]["Tables"]["performance"]["Row"];
export type Venue = Database["public"]["Tables"]["venue"]["Row"];
export type PerformanceSeason = Database["public"]["Tables"]["performance_season"]["Row"];
export type Person = Database["public"]["Tables"]["person"]["Row"];
export type PerformancePerson = Database["public"]["Tables"]["performance_person"]["Row"];
export type Evaluation = Database["public"]["Tables"]["evaluation"]["Row"];

// Insert 타입
export type UserInsert = Database["public"]["Tables"]["user"]["Insert"];
export type GuestInsert = Database["public"]["Tables"]["guest"]["Insert"];
export type PerformanceInsert = Database["public"]["Tables"]["performance"]["Insert"];
export type VenueInsert = Database["public"]["Tables"]["venue"]["Insert"];
export type PerformanceSeasonInsert = Database["public"]["Tables"]["performance_season"]["Insert"];
export type PersonInsert = Database["public"]["Tables"]["person"]["Insert"];
export type PerformancePersonInsert = Database["public"]["Tables"]["performance_person"]["Insert"];
export type EvaluationInsert = Database["public"]["Tables"]["evaluation"]["Insert"];

// Update 타입
export type UserUpdate = Database["public"]["Tables"]["user"]["Update"];
export type GuestUpdate = Database["public"]["Tables"]["guest"]["Update"];
export type PerformanceUpdate = Database["public"]["Tables"]["performance"]["Update"];
export type VenueUpdate = Database["public"]["Tables"]["venue"]["Update"];
export type PerformanceSeasonUpdate = Database["public"]["Tables"]["performance_season"]["Update"];
export type PersonUpdate = Database["public"]["Tables"]["person"]["Update"];
export type PerformancePersonUpdate = Database["public"]["Tables"]["performance_person"]["Update"];
export type EvaluationUpdate = Database["public"]["Tables"]["evaluation"]["Update"];

// 조인된 타입 (관계 데이터 포함)
export type PerformanceWithSeasons = Performance & {
  seasons: (PerformanceSeason & {
    venue: Venue;
  })[];
};

export type PerformanceSeasonWithDetails = PerformanceSeason & {
  performance: Performance;
  venue: Venue;
};

export type EvaluationWithDetails = Evaluation & {
  season: PerformanceSeasonWithDetails;
  user?: User | null;
  guest?: Guest | null;
};

