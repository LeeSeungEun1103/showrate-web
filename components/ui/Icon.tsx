import React from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Icon 컴포넌트
 * lucide-react 아이콘을 일관된 스타일로 래핑
 */
export interface IconProps {
  name: keyof typeof Icons;
  size?: number | string;
  className?: string;
  color?: string;
}

export default function Icon({ name, size = 20, className, color }: IconProps) {
  const IconComponent = Icons[name] as React.ComponentType<{
    size?: number | string;
    className?: string;
    color?: string;
  }>;
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }
  
  return (
    <IconComponent
      size={size}
      className={cn("flex-shrink-0", className)}
      color={color}
    />
  );
}

