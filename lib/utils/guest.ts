/**
 * Guest ID 관리 유틸리티
 * 로그인하지 않은 사용자를 위한 임시 ID 생성 및 관리
 */

const GUEST_ID_KEY = "showrate_guest_id";

/**
 * Guest ID를 가져오거나 생성합니다.
 */
export function getGuestId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  let guestId = localStorage.getItem(GUEST_ID_KEY);

  if (!guestId) {
    // UUID v4 생성
    guestId = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }

  return guestId;
}

/**
 * Guest ID를 설정합니다.
 */
export function setGuestId(guestId: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
}

/**
 * Guest ID를 초기화합니다.
 */
export function clearGuestId(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(GUEST_ID_KEY);
  }
}

