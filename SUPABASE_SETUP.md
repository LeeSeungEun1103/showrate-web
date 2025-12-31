# Supabase 설정 가이드

## 테이블 생성 오류 해결 방법

"Could not find the table 'public.performance' in the schema cache" 오류가 발생하는 경우, 다음 단계를 따라 해결하세요.

## 1. 테이블 생성 확인

### Supabase 대시보드에서 확인
1. [Supabase 대시보드](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Table Editor** 클릭
4. `performance` 테이블이 있는지 확인

### 테이블이 없는 경우 생성하기

**SQL Editor**에서 다음 SQL을 실행하세요:

```sql
-- performance 테이블 생성
CREATE TABLE IF NOT EXISTS public.performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화 (선택사항)
ALTER TABLE public.performance ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 추가
CREATE POLICY "Allow public read access"
  ON public.performance
  FOR SELECT
  USING (true);
```

## 2. RLS (Row Level Security) 정책 설정

테이블이 있지만 데이터를 읽을 수 없는 경우, RLS 정책을 확인하세요.

### 방법 1: RLS 비활성화 (개발 환경)
1. **Table Editor** → `performance` 테이블 선택
2. **Settings** 탭 클릭
3. **Enable Row Level Security** 토글을 **OFF**로 설정

### 방법 2: 읽기 정책 추가 (프로덕션 권장)
1. **Authentication** → **Policies** 메뉴로 이동
2. `performance` 테이블 선택
3. **New Policy** 클릭
4. 정책 설정:
   - **Policy name**: `Allow public read access`
   - **Allowed operation**: `SELECT`
   - **Policy definition**: `true` (모든 사용자가 읽기 가능)

또는 SQL Editor에서:

```sql
CREATE POLICY "Allow public read access"
  ON public.performance
  FOR SELECT
  USING (true);
```

## 3. 테이블 이름 확인

실제 테이블 이름이 다를 수 있습니다. 다음을 확인하세요:

1. **Table Editor**에서 실제 테이블 이름 확인
2. PostgreSQL은 테이블 이름을 소문자로 저장하지만, 따옴표로 감싸면 대소문자를 구분합니다
3. 코드에서 사용하는 테이블 이름과 일치하는지 확인

## 4. 모든 테이블 생성 SQL

전체 데이터베이스 스키마를 한 번에 생성하려면:

```sql
-- User 테이블
CREATE TABLE IF NOT EXISTS public.user (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guest 테이블
CREATE TABLE IF NOT EXISTS public.guest (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance 테이블
CREATE TABLE IF NOT EXISTS public.performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venue 테이블
CREATE TABLE IF NOT EXISTS public.venue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Season 테이블
CREATE TABLE IF NOT EXISTS public.performance_season (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  performance_id UUID NOT NULL REFERENCES public.performance(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venue(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Person 테이블
CREATE TABLE IF NOT EXISTS public.person (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL
);

-- Performance Person 테이블
CREATE TABLE IF NOT EXISTS public.performance_person (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  performance_id UUID NOT NULL REFERENCES public.performance(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.person(id) ON DELETE CASCADE,
  role TEXT NOT NULL
);

-- Evaluation 테이블
CREATE TABLE IF NOT EXISTS public.evaluation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES public.guest(id) ON DELETE SET NULL,
  season_id UUID NOT NULL REFERENCES public.performance_season(id) ON DELETE CASCADE,
  star_rating NUMERIC(3, 1) NOT NULL CHECK (star_rating >= 0 AND star_rating <= 5),
  like_rating NUMERIC(3, 1) NOT NULL CHECK (like_rating >= 0 AND like_rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_user_or_guest CHECK (
    (user_id IS NOT NULL AND guest_id IS NULL) OR
    (user_id IS NULL AND guest_id IS NOT NULL)
  )
);

-- RLS 활성화 및 정책 추가
ALTER TABLE public.performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_season ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_person ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 추가
CREATE POLICY "Allow public read access on performance"
  ON public.performance FOR SELECT USING (true);

CREATE POLICY "Allow public read access on venue"
  ON public.venue FOR SELECT USING (true);

CREATE POLICY "Allow public read access on performance_season"
  ON public.performance_season FOR SELECT USING (true);

CREATE POLICY "Allow public read access on person"
  ON public.person FOR SELECT USING (true);

CREATE POLICY "Allow public read access on performance_person"
  ON public.performance_person FOR SELECT USING (true);

CREATE POLICY "Allow public read access on evaluation"
  ON public.evaluation FOR SELECT USING (true);
```

## 5. 테스트 데이터 추가

테이블 생성 후 테스트 데이터를 추가하려면:

```sql
-- 테스트 공연 데이터 추가
INSERT INTO public.performance (title, description)
VALUES 
  ('레미제라블', '빅토르 위고의 소설을 원작으로 한 뮤지컬'),
  ('오페라의 유령', '앤드루 로이드 웨버의 대표작'),
  ('햄릿', '셰익스피어의 4대 비극 중 하나');
```

## 6. 문제 해결 체크리스트

- [ ] Supabase 대시보드에서 테이블이 존재하는지 확인
- [ ] 테이블 이름이 정확히 `performance`인지 확인 (대소문자 포함)
- [ ] RLS가 활성화되어 있다면 읽기 정책이 있는지 확인
- [ ] 환경 변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)가 올바르게 설정되었는지 확인
- [ ] Supabase 프로젝트가 활성화되어 있는지 확인
- [ ] 네트워크 연결이 정상인지 확인

## 추가 도움말

- [Supabase 공식 문서](https://supabase.com/docs)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Discord 커뮤니티](https://discord.supabase.com)

