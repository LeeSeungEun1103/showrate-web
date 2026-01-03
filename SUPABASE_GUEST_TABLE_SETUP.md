# Supabase `public.guest` 테이블 설정 가이드

## 문제
Guest 평가를 저장할 때 `EVALUATION_guest_id_fkey` 제약 위반이 발생합니다.
이는 `public.guest` 테이블에 Guest 레코드가 없기 때문입니다.

## 해결 방법

### 1. `public.guest` 테이블 확인

Supabase Dashboard > Table Editor에서 `guest` 테이블이 존재하는지 확인하세요.

### 2. RLS 정책 설정

`public.guest` 테이블에 INSERT 권한이 있는지 확인하고, 필요하면 다음 정책을 추가하세요:

```sql
-- RLS 활성화
ALTER TABLE public.guest ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 Guest 레코드를 생성할 수 있도록 (개발 단계)
CREATE POLICY "Allow public insert on guest"
  ON public.guest FOR INSERT
  WITH CHECK (true);

-- 모든 사용자가 Guest 레코드를 조회할 수 있도록 (선택사항)
CREATE POLICY "Allow public read access on guest"
  ON public.guest FOR SELECT
  USING (true);
```

### 3. 테이블 구조 확인

`public.guest` 테이블 구조:
- `id` (UUID, PRIMARY KEY, NOT NULL)
- `created_at` (TIMESTAMP, DEFAULT NOW())

## 확인 방법

1. Supabase Dashboard > Table Editor > `guest` 테이블
2. Authentication > Policies에서 RLS 정책 확인
3. 테스트: Guest 평가 저장 시 `public.guest` 테이블에 레코드가 생성되는지 확인

