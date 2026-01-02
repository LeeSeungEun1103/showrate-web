import React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Button 컴포넌트
 * 디자인 시스템에 맞춘 재사용 가능한 버튼
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = "font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-black text-white hover:bg-zinc-800 focus:ring-zinc-500",
    secondary: "bg-zinc-100 text-black hover:bg-zinc-200 focus:ring-zinc-500",
    ghost: "text-black hover:bg-zinc-100 focus:ring-zinc-500",
    outline: "border border-zinc-300 text-black hover:bg-zinc-50 focus:ring-zinc-500",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-base rounded-lg",
    lg: "px-6 py-3 text-base rounded-lg",
  };
  
  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

