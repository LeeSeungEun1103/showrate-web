/**
 * MVP 디버깅용 임시 사용자 관리 유틸리티
 * 나중에 Supabase Auth로 교체 예정
 */

const DEV_USER_ID_KEY = "showrate_dev_user_id";
const DEV_USER_ID = "00000000-0000-0000-0000-000000000001"; // 고정된 테스트 UUID

/**
 * Dev User ID를 가져오거나 생성합니다.
 */
export function getDevUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(DEV_USER_ID_KEY);
}

/**
 * Dev User ID를 설정합니다.
 */
export function setDevUserId(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(DEV_USER_ID_KEY, DEV_USER_ID);
  }
}

/**
 * Dev User ID를 초기화합니다.
 */
export function clearDevUserId(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(DEV_USER_ID_KEY);
  }
}

/**
 * 고정된 Dev User ID를 반환합니다.
 */
export function getFixedDevUserId(): string {
  return DEV_USER_ID;
}

