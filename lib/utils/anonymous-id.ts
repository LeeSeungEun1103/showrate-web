/**
 * Anonymous ID 관리 유틸리티
 * localStorage에 저장된 UUID를 관리합니다.
 */

const ANONYMOUS_ID_KEY = "showrate_anonymous_id";

/**
 * Anonymous ID를 가져오거나 생성합니다.
 * localStorage에 저장된 UUID가 없으면 새로 생성합니다.
 */
export function getAnonymousId(): string {
  if (typeof window === "undefined") {
    // 서버 사이드에서는 빈 문자열 반환
    return "";
  }

  let anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY);

  if (!anonymousId) {
    // UUID v4 생성
    anonymousId = crypto.randomUUID();
    localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
  }

  return anonymousId;
}

/**
 * Anonymous ID를 초기화합니다 (테스트용).
 */
export function clearAnonymousId(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ANONYMOUS_ID_KEY);
  }
}

