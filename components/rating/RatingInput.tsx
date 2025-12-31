"use client";

import { useState } from "react";

interface RatingInputProps {
  label: string;
  value: number; // 0 ~ 5.0 (0은 빈 상태)
  onChange: (value: number) => void;
  icon?: "star" | "heart";
  disabled?: boolean;
}

/**
 * 0.5 단위로 평가를 입력할 수 있는 컴포넌트
 * 5개 아이콘을 표시하며, 각 아이콘은 1점을 나타냅니다.
 * 0.5 단위는 반만 찬 아이콘으로 표시됩니다.
 * value가 0이면 모든 아이콘이 빈 상태로 표시됩니다.
 * 터치 친화적 UX 개선
 */
export default function RatingInput({
  label,
  value,
  onChange,
  icon = "star",
  disabled = false,
}: RatingInputProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const totalIcons = 5; // 5개 아이콘

  // 각 아이콘의 상태 계산
  // value가 0이면 모두 empty
  const getIconState = (index: number): "filled" | "half" | "empty" => {
    if (value === 0) {
      // 호버 상태일 때는 미리보기
      if (hoverIndex !== null && index <= hoverIndex) {
        return index < hoverIndex ? "filled" : "half";
      }
      return "empty";
    }
    
    const iconValue = index + 1; // 1, 2, 3, 4, 5
    if (value >= iconValue) {
      return "filled";
    } else if (value >= iconValue - 0.5) {
      return "half";
    } else {
      return "empty";
    }
  };

  const handleClick = (index: number, isLeftHalf: boolean) => {
    if (disabled) return;
    if (isLeftHalf) {
      // 왼쪽 절반 클릭 = 0.5 단위
      const newValue = index + 0.5; // 0.5, 1.5, 2.5, 3.5, 4.5
      onChange(newValue);
    } else {
      // 오른쪽 절반 또는 전체 클릭 = 정수값
      const newValue = index + 1; // 1, 2, 3, 4, 5
      onChange(newValue);
    }
    setHoverIndex(null);
  };

  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const isLeftHalf = touchX < rect.width / 2;
    handleClick(index, isLeftHalf);
  };

  const handleMouseEnter = (index: number) => {
    if (disabled) return;
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div className="w-full">
      <label className="mb-3 block text-base font-medium text-black">
        {label}
      </label>
      <div className="flex items-center gap-2">
        {Array.from({ length: totalIcons }).map((_, index) => {
          const state = getIconState(index);

          return (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const isLeftHalf = clickX < rect.width / 2;
                handleClick(index, isLeftHalf);
              }}
              onTouchStart={(e) => handleTouchStart(index, e)}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              disabled={disabled}
              className={`
                relative flex h-12 w-12 items-center justify-center
                touch-manipulation select-none
                transition-all duration-150
                active:scale-90
                disabled:opacity-50 disabled:cursor-not-allowed
                ${disabled ? "" : "cursor-pointer"}
                ${hoverIndex !== null && index <= hoverIndex ? "opacity-80" : ""}
              `}
              aria-label={`${label} ${index + 1}점`}
            >
              {icon === "star" ? (
                <StarIcon state={state} index={index} />
              ) : (
                <HeartIcon state={state} index={index} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StarIcon({ state, index }: { state: "filled" | "half" | "empty"; index: number }) {
  const gradientId = `star-half-${index}`;
  
  if (state === "filled") {
    return (
      <svg
        className="h-10 w-10 text-yellow-400"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }

  if (state === "half") {
    return (
      <svg
        className="h-10 w-10 text-yellow-400"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          fill={`url(#${gradientId})`}
        />
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      </svg>
    );
  }

  return (
    <svg
      className="h-10 w-10 text-zinc-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  );
}

function HeartIcon({ state, index }: { state: "filled" | "half" | "empty"; index: number }) {
  const gradientId = `heart-half-${index}`;
  
  if (state === "filled") {
    return (
      <svg
        className="h-10 w-10 text-red-400"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (state === "half") {
    return (
      <svg
        className="h-10 w-10 text-red-400"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          fillRule="evenodd"
          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
          clipRule="evenodd"
          fill={`url(#${gradientId})`}
        />
        <path
          fillRule="evenodd"
          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
          clipRule="evenodd"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      </svg>
    );
  }

  return (
    <svg
      className="h-10 w-10 text-zinc-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        fillRule="evenodd"
        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
        clipRule="evenodd"
      />
    </svg>
  );
}
