import React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * SearchInput 컴포넌트
 * 검색 바 공통 컴포넌트
 */
export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
}

export default function SearchInput({
  placeholder = "공연 검색",
  className,
  ...props
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        type="text"
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg bg-zinc-100 px-4 py-2.5 pl-10 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-zinc-200",
          "placeholder:text-zinc-500",
          className
        )}
        {...props}
      />
    </div>
  );
}

