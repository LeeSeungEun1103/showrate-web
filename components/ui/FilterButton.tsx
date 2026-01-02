import React from "react";
import { Star, Heart, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * FilterButton 컴포넌트
 * 정렬 필터 버튼 (별/하트 + 화살표)
 */
export interface FilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  star?: "up" | "down" | null;
  heart?: "up" | "down" | null;
}

export default function FilterButton({
  active = false,
  star,
  heart,
  className,
  ...props
}: FilterButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-black text-white"
          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200",
        className
      )}
      {...props}
    >
      {star && (
        <>
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          {star === "up" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
        </>
      )}
      {heart && (
        <>
          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
          {heart === "up" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
        </>
      )}
    </button>
  );
}

