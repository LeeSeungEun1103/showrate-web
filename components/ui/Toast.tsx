"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

/**
 * 토스트 알림 컴포넌트
 */
export default function Toast({
  message,
  isVisible,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 transform">
      <div className="rounded-lg bg-zinc-900 px-4 py-3 text-sm text-white shadow-lg">
        {message}
      </div>
    </div>
  );
}

