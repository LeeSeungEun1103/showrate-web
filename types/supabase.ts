/**
 * Supabase 타입 정의
 * Database 타입에서 직접 추출하여 Supabase 쿼리에서 사용
 */

import { Database } from "./database";

// Evaluation 타입
export type EvaluationRow = Database["public"]["Tables"]["evaluation"]["Row"];
export type EvaluationInsert = Database["public"]["Tables"]["evaluation"]["Insert"];
export type EvaluationUpdate = Database["public"]["Tables"]["evaluation"]["Update"];

// Performance 타입
export type PerformanceRow = Database["public"]["Tables"]["performance"]["Row"];
export type PerformanceInsert = Database["public"]["Tables"]["performance"]["Insert"];
export type PerformanceUpdate = Database["public"]["Tables"]["performance"]["Update"];

