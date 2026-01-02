import React from "react";
import { Star, Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * RatingDisplay 컴포넌트
 * 별점/하트 점수를 5개 아이콘으로 시각적으로 표시
 */
export interface RatingDisplayProps {
  type: "star" | "heart";
  value: number; // 0.0 ~ 5.0
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
}

export default function RatingDisplay({
  type,
  value,
  size = "md",
  showNumber = false,
}: RatingDisplayProps) {
  const Icon = type === "star" ? Star : Heart;
  const fillColor = type === "star" ? "fill-yellow-400 text-yellow-400" : "fill-red-500 text-red-500";
  const emptyColor = "fill-zinc-200 text-zinc-200";
  
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  // 5개 아이콘 렌더링
  const icons = [];
  for (let i = 1; i <= 5; i++) {
    const isFilled = value >= i;
    const isHalfFilled = value >= i - 0.5 && value < i;
    
    if (isHalfFilled) {
      // 0.5점: 회색 배경 + 색상 반만 채워진 상태
      const sizeValue = size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5";
      icons.push(
        <div key={i} className="relative" style={{ width: size === "sm" ? "12px" : size === "md" ? "16px" : "20px", height: size === "sm" ? "12px" : size === "md" ? "16px" : "20px" }}>
          <Icon className={cn(sizeClasses[size], emptyColor)} />
          <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
            <Icon className={cn(sizeClasses[size], fillColor)} />
          </div>
        </div>
      );
    } else {
      icons.push(
        <Icon
          key={i}
          className={cn(
            sizeClasses[size],
            isFilled ? fillColor : emptyColor
          )}
        />
      );
    }
  }

  return (
    <div className="flex items-center gap-1">
      {icons}
      {showNumber && (
        <span className="ml-1 text-sm font-bold text-black">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

