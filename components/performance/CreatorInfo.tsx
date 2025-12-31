/**
 * 공연 작가/작곡가 정보 표시 컴포넌트
 * 재사용 가능한 UI 컴포넌트
 */

interface CreatorInfoProps {
  writer: string | null;
  composer: string | null;
  className?: string;
}

export default function CreatorInfo({
  writer,
  composer,
  className = "",
}: CreatorInfoProps) {
  // 둘 다 없으면 표시하지 않음
  if (!writer && !composer) {
    return null;
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {writer && (
        <div className="rounded bg-zinc-100 px-3 py-1.5 text-sm text-zinc-600">
          극본 : {writer}
        </div>
      )}
      {composer && (
        <div className="rounded bg-zinc-100 px-3 py-1.5 text-sm text-zinc-600">
          작곡 : {composer}
        </div>
      )}
    </div>
  );
}

