import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";

/**
 * 클라이언트 컴포넌트에서 사용할 Supabase 클라이언트
 * 'use client' 지시어가 있는 컴포넌트에서 사용합니다.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

