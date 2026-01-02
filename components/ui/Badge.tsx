import React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Badge 컴포넌트
 * 작가/작곡가 정보 등에 사용되는 작은 라벨
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "secondary";
  children: React.ReactNode;
}

export default function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-zinc-100 text-zinc-600",
    primary: "bg-black text-white",
    secondary: "bg-zinc-200 text-zinc-700",
  };
  
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

