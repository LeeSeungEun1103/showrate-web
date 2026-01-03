# Supabase `public.user` 테이블 수정 가이드

## 문제
현재 `public.user` 테이블에 `password_hash` 컬럼이 있어서, Supabase Auth와의 역할 분리가 명확하지 않습니다.

## 올바른 구조

Supabase Auth를 사용할 때:
- **`auth.users`**: Supabase Auth가 관리하는 인증 테이블 (비밀번호 포함)
- **`public.user`**: 애플리케이션 프로필 테이블 (비밀번호 없음, `auth.users.id` 참조)

## 해결 방법

Supabase Dashboard > SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- password_hash 컬럼 제거
ALTER TABLE public.user 
DROP COLUMN IF EXISTS password_hash;

-- email을 nullable로 변경 (선택사항)
ALTER TABLE public.user 
ALTER COLUMN email DROP NOT NULL;

-- id는 auth.users.id와 동일하므로 NOT NULL 유지
-- id는 UUID 타입이어야 함
```

## 테이블 구조 확인

수정 후 `public.user` 테이블 구조:
- `id` (UUID, PRIMARY KEY, NOT NULL) - `auth.users.id`와 동일
- `email` (TEXT, NULLABLE) - 프로필 이메일
- `created_at` (TIMESTAMP, DEFAULT NOW())

## RLS 정책 설정

`public.user` 테이블에 INSERT/UPDATE 권한이 있는지 확인:

```sql
-- RLS 활성화
ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자가 자신의 프로필을 생성할 수 있도록
CREATE POLICY "Users can insert their own profile"
  ON public.user FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 인증된 사용자가 자신의 프로필을 수정할 수 있도록
CREATE POLICY "Users can update their own profile"
  ON public.user FOR UPDATE
  USING (auth.uid() = id);

-- 인증된 사용자가 자신의 프로필을 조회할 수 있도록
CREATE POLICY "Users can view their own profile"
  ON public.user FOR SELECT
  USING (auth.uid() = id);

-- 개발 단계: 모든 사용자가 프로필을 조회할 수 있도록 (선택사항)
CREATE POLICY "Allow public read access on user"
  ON public.user FOR SELECT
  USING (true);
```

## 데이터 흐름

1. **회원가입**: `supabase.auth.signUp()` → `auth.users` 테이블에 사용자 생성
2. **프로필 생성**: `public.user` 테이블에 프로필 생성 (id = auth.users.id)
3. **로그인**: `supabase.auth.signInWithPassword()` → `auth.users`에서 인증
4. **프로필 조회**: `public.user` 테이블에서 프로필 조회

## 확인 방법

1. Supabase Dashboard > Table Editor > `user` 테이블
2. `password_hash` 컬럼이 제거되었는지 확인
3. Authentication > Policies에서 RLS 정책 확인
4. 테스트: 회원가입 후 `public.user` 테이블에 프로필이 생성되는지 확인
