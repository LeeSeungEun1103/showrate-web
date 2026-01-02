import React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * StatsBanner 컴포넌트
 * 상단 통계 배너 (상위 3%, 지금까지 공연 N개)
 */
export interface StatsBannerProps {
  rank?: string;
  count: number;
  userName?: string;
  className?: string;
}

export default function StatsBanner({
  rank = "상위 3%",
  count,
  userName,
  className,
}: StatsBannerProps) {
  return (
    <div className={cn("px-4 pb-4 text-center", className)}>
      <p className="text-sm text-rose-500">{rank}</p>
      <p className="mt-1 text-base font-medium text-black">
        {userName ? (
          <>
            <strong>{userName}</strong>님, 총 공연 <strong>{count}</strong> 개를 보셨어요
          </>
        ) : (
          <>
            지금까지 공연 <strong>{count}</strong> 개를 보셨어요
          </>
        )}
      </p>
    </div>
  );
}

