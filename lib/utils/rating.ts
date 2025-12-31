/**
 * 평가 관련 유틸리티 함수
 */

/**
 * 평가 값을 0.5 단위로 정규화합니다.
 * DB 제약 조건을 만족시키기 위해 사용합니다.
 * 
 * @param value 평가 값 (0.5 ~ 5.0)
 * @returns 0.5 단위로 반올림된 값
 */
export function normalizeRating(value: number): number {
  // 최소값 0.5, 최대값 5.0
  const min = 0.5;
  const max = 5.0;
  
  // 범위 제한
  let normalized = Math.max(min, Math.min(max, value));
  
  // 0.5 단위로 반올림
  normalized = Math.round(normalized * 2) / 2;
  
  // 최소값 보장
  if (normalized < min) {
    normalized = min;
  }
  
  return normalized;
}

/**
 * 평가 값이 유효한지 확인합니다.
 * 
 * @param value 평가 값
 * @returns 유효하면 true
 */
export function isValidRating(value: number): boolean {
  return value >= 0.5 && value <= 5.0 && value % 0.5 === 0;
}

