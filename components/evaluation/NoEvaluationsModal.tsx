"use client";

interface NoEvaluationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 평가할 공연이 없을 때 표시되는 모달
 */
export default function NoEvaluationsModal({
  isOpen,
  onClose,
}: NoEvaluationsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold text-black">
          평가할 공연이 없습니다
        </h2>
        <p className="mb-6 text-sm text-zinc-600">
          모든 공연에 대한 평가를 완료하셨습니다.
        </p>
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          확인
        </button>
      </div>
    </div>
  );
}

