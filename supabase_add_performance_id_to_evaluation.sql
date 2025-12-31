-- ============================================
-- evaluation 테이블에 performance_id 컬럼 추가 및 제약 조건 설정
-- ============================================
-- 
-- 핵심 원칙:
-- 1. 평가는 공연(performance) 단위로만 이루어짐
-- 2. 한 유저는 한 공연을 1번만 평가 (user_id + performance_id 기준)
-- 3. season_id는 평가 기준에서 완전히 무시 (UNIQUE 제약에 포함하지 않음)
-- ============================================

-- 1. performance_id 컬럼 추가 (nullable로 시작)
ALTER TABLE public.evaluation
ADD COLUMN IF NOT EXISTS performance_id UUID;

-- 2. 기존 데이터 마이그레이션 (season_id를 통해 performance_id 찾기)
UPDATE public.evaluation e
SET performance_id = ps.performance_id
FROM public.performance_season ps
WHERE e.season_id = ps.id
  AND e.performance_id IS NULL;

-- 3. performance_id를 NOT NULL로 변경
-- 주의: 기존 데이터가 모두 마이그레이션된 후에만 실행하세요
-- ALTER TABLE public.evaluation
-- ALTER COLUMN performance_id SET NOT NULL;

-- 4. Foreign Key 제약 조건 추가
ALTER TABLE public.evaluation
DROP CONSTRAINT IF EXISTS evaluation_performance_id_fkey;

ALTER TABLE public.evaluation
ADD CONSTRAINT evaluation_performance_id_fkey
FOREIGN KEY (performance_id)
REFERENCES public.performance(id)
ON DELETE CASCADE;

-- 5. 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_evaluation_performance_id 
ON public.evaluation(performance_id);

CREATE INDEX IF NOT EXISTS idx_evaluation_user_performance
ON public.evaluation(user_id, performance_id)
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_evaluation_guest_performance
ON public.evaluation(guest_id, performance_id)
WHERE guest_id IS NOT NULL;

-- 6. 기존 UNIQUE 제약 조건 제거 (season_id 포함된 것들)
DROP INDEX IF EXISTS idx_evaluation_user_performance_season;
DROP INDEX IF EXISTS public.idx_evaluation_user_performance_season;

-- 7. 새로운 UNIQUE 제약 조건 추가 (user_id + performance_id만)
-- 같은 사용자가 같은 공연을 중복 평가하지 않도록
CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluation_user_performance_unique
ON public.evaluation(user_id, performance_id)
WHERE user_id IS NOT NULL;

-- 8. guest_id + performance_id에 대한 UNIQUE 제약 조건
CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluation_guest_performance_unique
ON public.evaluation(guest_id, performance_id)
WHERE guest_id IS NOT NULL;

-- 9. 확인 쿼리
SELECT 
  COUNT(*) as total_evaluations,
  COUNT(performance_id) as evaluations_with_performance_id,
  COUNT(*) - COUNT(performance_id) as evaluations_without_performance_id
FROM public.evaluation;

-- 10. 중복 평가 확인 쿼리 (실행 후 확인용)
SELECT 
  user_id,
  performance_id,
  COUNT(*) as duplicate_count
FROM public.evaluation
WHERE user_id IS NOT NULL
GROUP BY user_id, performance_id
HAVING COUNT(*) > 1;
