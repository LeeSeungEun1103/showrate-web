"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import LoginForm from "@/components/auth/LoginForm";
import GlobalNav from "@/components/layout/GlobalNav";

/**
 * 로그인 페이지
 * "이전 평가 다시 확인하기" 플로우에서 사용
 */
export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white pb-20">
      <main className="mx-auto max-w-md px-4 py-6">
        <Header title="ShowRate" showLogout={false} />

        <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-black">
            이전 평가를 확인하려면 이메일과 비밀번호를 입력해주세요.
          </h2>
          <LoginForm />
        </div>
      </main>
      <GlobalNav />
    </div>
  );
}

