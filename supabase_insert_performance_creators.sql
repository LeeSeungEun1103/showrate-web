-- ============================================
-- 공연 작가/작곡가 연결 SQL
-- ============================================
-- 
-- 규칙:
-- 1. 이미 performance_person에 연결된 공연은 제외 (role별로 확인)
-- 2. 지정한 공연 1개(title 기준)는 제외
-- 3. 나머지 공연 각각에 writer 1명, composer 1명 연결
-- 4. 기존 person 테이블 데이터 재사용, 부족하면 추가
-- 5. role은 'writer' 또는 'composer'만 사용
-- ============================================

-- ============================================
-- 1단계: 필요한 person이 없으면 추가
-- ============================================
-- 기존 person 테이블에 있는 이름은 재사용하고, 없으면 추가합니다.

-- 작가 목록 (필요시 추가)
INSERT INTO public.person (name)
SELECT '김작가' WHERE NOT EXISTS (SELECT 1 FROM public.person WHERE name = '김작가')
UNION ALL
SELECT '이작가' WHERE NOT EXISTS (SELECT 1 FROM public.person WHERE name = '이작가')
UNION ALL
SELECT '박작가' WHERE NOT EXISTS (SELECT 1 FROM public.person WHERE name = '박작가')
UNION ALL
SELECT '최작가' WHERE NOT EXISTS (SELECT 1 FROM public.person WHERE name = '최작가')
UNION ALL
SELECT '정작가' WHERE NOT EXISTS (SELECT 1 FROM public.person WHERE name = '정작가');

-- 작곡가 목록 (필요시 추가)
INSERT INTO public.person (name)
SELECT '김작곡' WHERE NOT EXISTS (SELECT 1 FROM public.person WHERE name = '김작곡')
UNION ALL
SELECT '이작곡' WHERE NOT EXISTS (SELECT 1 FROM public.person WHERE name = '이작곡')
UNION ALL
SELECT '박작곡' WHERE NOT EXISTS (SELECT 1 FROM public.person WHERE name = '박작곡')
UNION ALL
SELECT '최작곡' WHERE NOT EXISTS (SELECT 1 FROM public.person WHERE name = '최작곡')
UNION ALL
SELECT '정작곡' WHERE NOT EXISTS (SELECT 1 FROM public.person WHERE name = '정작곡');

-- ============================================
-- 2단계: 나머지 공연에 writer 연결
-- ============================================
-- 아래 '제외할공연'을 실제 제외할 공연의 title로 변경하세요.
-- 제외할 공연이 없으면 WHERE 절을 제거하거나 빈 문자열로 설정하세요.

WITH 
-- 이미 writer가 연결된 공연 ID 목록
existing_performances_writer AS (
  SELECT DISTINCT performance_id 
  FROM public.performance_person
  WHERE role = 'writer'
),
-- 제외할 공연 (title 기준으로 지정)
-- ⚠️ 여기에 실제 제외할 공연의 title을 입력하세요
-- 제외할 공연이 없으면 이 CTE를 비워두세요 (WHERE 1=0)
excluded_performance AS (
  SELECT id 
  FROM public.performance 
  WHERE title = '제외할공연'  -- ⚠️ 실제 제외할 공연 제목으로 변경 필요 (없으면 '제외할공연'을 존재하지 않는 제목으로 변경)
),
-- writer가 없는 공연 목록
target_performances_writer AS (
  SELECT p.id, p.title,
    ROW_NUMBER() OVER (ORDER BY p.created_at) as rn
  FROM public.performance p
  WHERE p.id NOT IN (SELECT performance_id FROM existing_performances_writer)
    AND p.id NOT IN (SELECT id FROM excluded_performance)
),
-- 작가 목록 (순환 배정용)
writers AS (
  SELECT id, name,
    ROW_NUMBER() OVER (ORDER BY name) as rn
  FROM public.person
  WHERE id IN (
    SELECT id FROM public.person WHERE name IN ('김작가', '이작가', '박작가', '최작가', '정작가')
  )
)
-- writer 연결
INSERT INTO public.performance_person (performance_id, person_id, role)
SELECT 
  tp.id as performance_id,
  w.id as person_id,
  'writer' as role
FROM target_performances_writer tp
CROSS JOIN LATERAL (
  SELECT id FROM writers 
  WHERE rn = ((tp.rn - 1) % (SELECT COUNT(*) FROM writers)) + 1
  LIMIT 1
) w
WHERE NOT EXISTS (
  SELECT 1 FROM public.performance_person pp
  WHERE pp.performance_id = tp.id AND pp.role = 'writer'
);

-- ============================================
-- 3단계: 나머지 공연에 composer 연결
-- ============================================

WITH 
-- 이미 composer가 연결된 공연 ID 목록
existing_performances_composer AS (
  SELECT DISTINCT performance_id 
  FROM public.performance_person
  WHERE role = 'composer'
),
-- 제외할 공연 (title 기준으로 지정)
excluded_performance AS (
  SELECT id 
  FROM public.performance 
  WHERE title = '제외할공연'  -- ⚠️ 실제 제외할 공연 제목으로 변경 필요
),
-- composer가 없는 공연 목록
target_performances_composer AS (
  SELECT p.id, p.title,
    ROW_NUMBER() OVER (ORDER BY p.created_at) as rn
  FROM public.performance p
  WHERE p.id NOT IN (SELECT performance_id FROM existing_performances_composer)
    AND p.id NOT IN (SELECT id FROM excluded_performance)
),
-- 작곡가 목록 (순환 배정용)
composers AS (
  SELECT id, name,
    ROW_NUMBER() OVER (ORDER BY name) as rn
  FROM public.person
  WHERE id IN (
    SELECT id FROM public.person WHERE name IN ('김작곡', '이작곡', '박작곡', '최작곡', '정작곡')
  )
)
-- composer 연결
INSERT INTO public.performance_person (performance_id, person_id, role)
SELECT 
  tp.id as performance_id,
  c.id as person_id,
  'composer' as role
FROM target_performances_composer tp
CROSS JOIN LATERAL (
  SELECT id FROM composers 
  WHERE rn = ((tp.rn - 1) % (SELECT COUNT(*) FROM composers)) + 1
  LIMIT 1
) c
WHERE NOT EXISTS (
  SELECT 1 FROM public.performance_person pp
  WHERE pp.performance_id = tp.id AND pp.role = 'composer'
);

-- ============================================
-- 실행 후 확인 쿼리
-- ============================================
-- 연결된 공연과 작가/작곡가 확인
SELECT 
  p.title as 공연명,
  pp.role as 역할,
  per.name as 이름
FROM public.performance p
JOIN public.performance_person pp ON p.id = pp.performance_id
JOIN public.person per ON pp.person_id = per.id
ORDER BY p.title, pp.role;

-- 작가/작곡가가 없는 공연 확인
SELECT 
  p.id,
  p.title,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM public.performance_person pp WHERE pp.performance_id = p.id AND pp.role = 'writer') THEN '작가 없음'
    ELSE '작가 있음'
  END as 작가상태,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM public.performance_person pp WHERE pp.performance_id = p.id AND pp.role = 'composer') THEN '작곡가 없음'
    ELSE '작곡가 있음'
  END as 작곡가상태
FROM public.performance p
ORDER BY p.created_at;
