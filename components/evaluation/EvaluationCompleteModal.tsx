"use client";

interface EvaluationCompleteModalProps {
  totalCount: number;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * 평가 완료 확인 팝업
 */
export default function EvaluationCompleteModal({
  totalCount,
  onConfirm,
  onClose,
}: EvaluationCompleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-black">
          평가 완료
        </h2>
        <p className="mb-6 text-zinc-600">
          총 <strong className="font-semibold text-black">{totalCount}개</strong>의
          공연을 평가하셨습니다.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            닫기
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-black px-4 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800"
          >
            저장 후 결과 확인
          </button>
        </div>
      </div>
    </div>
  );
}

