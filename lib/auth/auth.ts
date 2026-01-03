/**
 * Supabase Auth 관련 유틸리티 함수
 */

import { createClient } from "@/lib/supabase/client";
import { clearGuestId } from "@/lib/utils/guest";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface AuthResult {
  user: User | null;
  error: Error | null;
}

/**
 * 이메일과 비밀번호로 회원가입
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, error: new Error(error.message) };
    }

    // public.user_profile 테이블에 프로필 생성 (auth.users.id를 기준으로)
    if (data.user) {
      let retries = 3;
      let profileError = null;
      
      while (retries > 0) {
        const insertData: Database["public"]["Tables"]["user_profile"]["Insert"] = {
          id: data.user.id, // auth.users.id
          email: data.user.email || email || "unknown@example.com", // email은 필수
        };
        const { error } = await supabase
          .from("user_profile")
          .upsert(insertData, {
            onConflict: "id"
          });

        if (!error) {
          profileError = null;
          break;
        }
        
        profileError = error;
        retries--;
        
        // 재시도 전 잠시 대기
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (profileError) {
        console.error("Failed to create user profile after retries:", profileError);
        console.error("Profile error details:", JSON.stringify(profileError, null, 2));
        // 프로필 생성 실패해도 auth는 성공한 것으로 처리
      }
    }

    return { user: data.user, error: null };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * 이메일과 비밀번호로 로그인
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: new Error(error.message) };
    }

    // public.user_profile 테이블에 프로필이 없으면 생성 (auth.users.id를 기준으로)
    if (data.user) {
      let retries = 3;
      let profileError = null;
      
      while (retries > 0) {
        const insertData: Database["public"]["Tables"]["user_profile"]["Insert"] = {
          id: data.user.id, // auth.users.id
          email: data.user.email || email || "unknown@example.com", // email은 필수
        };
        const { error } = await supabase
          .from("user_profile")
          .upsert(insertData, {
            onConflict: "id"
          });

        if (!error) {
          profileError = null;
          break;
        }
        
        profileError = error;
        retries--;
        
        // 재시도 전 잠시 대기
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (profileError) {
        console.error("Failed to upsert user profile after retries:", profileError);
        console.error("Profile error details:", JSON.stringify(profileError, null, 2));
      }
    }

    return { user: data.user, error: null };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * 현재 로그인된 사용자 가져오기
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}

/**
 * 로그아웃
 */
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  // 로그아웃 시 게스트 ID도 클리어하여 새로운 게스트 세션 시작
  clearGuestId();
}

/**
 * 세션 상태 확인 (클라이언트 컴포넌트용)
 */
export async function getSession() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

