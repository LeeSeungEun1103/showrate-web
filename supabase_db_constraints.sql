-- ============================================
-- Supabase DB 제약 조건 및 인덱스 설정
-- ============================================

-- 1. performance_person.role CHECK 제약 추가
-- role은 'writer' 또는 'composer'만 허용
ALTER TABLE public.performance_person
DROP CONSTRAINT IF EXISTS performance_person_role_check;

ALTER TABLE public.performance_person
ADD CONSTRAINT performance_person_role_check 
CHECK (role IN ('writer', 'composer'));

-- 2. 동일 performance + role 중복 방지 (UNIQUE 제약)
-- 한 공연에 같은 역할의 사람이 중복으로 연결되는 것을 방지
ALTER TABLE public.performance_person
DROP CONSTRAINT IF EXISTS performance_person_performance_role_unique;

CREATE UNIQUE INDEX IF NOT EXISTS performance_person_performance_role_unique
ON public.performance_person (performance_id, role);

-- 3. 성능 향상을 위한 인덱스 추가
-- performance_id로 조회가 많으므로 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_performance_person_performance_id
ON public.performance_person (performance_id);

CREATE INDEX IF NOT EXISTS idx_performance_person_person_id
ON public.performance_person (person_id);

CREATE INDEX IF NOT EXISTS idx_performance_person_role
ON public.performance_person (role);

-- 4. person.name에 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_person_name
ON public.person (name);

