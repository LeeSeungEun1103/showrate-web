import React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Card 컴포넌트
 * 공연 목록 아이템 등에 사용되는 카드 컨테이너
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover" | "interactive";
  children: React.ReactNode;
}

export default function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  const variants = {
    default: "bg-white border border-zinc-200",
    hover: "bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors",
    interactive: "bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors cursor-pointer",
  };
  
  return (
    <div
      className={cn(
        "rounded-lg p-4",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

