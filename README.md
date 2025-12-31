# ShowRate - 공연 평가 플랫폼

무대 공연(뮤지컬, 연극)을 평가하고 공유하는 모바일 우선 웹 애플리케이션입니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 주요 기능

- 공연 평가 시스템
  - `star_rating` (0-5, 0.5 단위): 예술적 품질 평가
  - `like_rating` (0-5, 0.5 단위): 개인적 선호도 평가
- 공연 시즌 관리
- 장소(Venue)별 공연 관리
- 로그인 사용자 및 게스트 평가 지원

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Supabase 프로젝트 설정 페이지에서 URL과 Anon Key를 확인할 수 있습니다:
https://app.supabase.com/project/_/settings/api

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
showrate-web/
├── app/                    # Next.js App Router 페이지 및 레이아웃
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈 페이지 (공연 목록)
│   └── globals.css        # 전역 스타일
├── lib/                   # 유틸리티 및 라이브러리
│   └── supabase/          # Supabase 클라이언트
│       ├── server.ts      # 서버 컴포넌트용 클라이언트
│       └── client.ts      # 클라이언트 컴포넌트용 클라이언트
├── types/                  # TypeScript 타입 정의
│   ├── database.ts        # 데이터베이스 스키마 타입
│   └── index.ts           # 애플리케이션 타입
└── public/                 # 정적 파일
```

## 데이터베이스 구조

데이터베이스 ERD는 `showrate-erd.md` 파일을 참고하세요.

주요 테이블:
- `performance`: 공연 정보
- `performance_season`: 공연 시즌 정보
- `venue`: 공연장 정보
- `evaluation`: 평가 정보
- `user`: 로그인 사용자
- `guest`: 게스트 사용자

## 개발 가이드

### Supabase 클라이언트 사용

**서버 컴포넌트에서:**
```typescript
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = createClient();
  const { data } = await supabase.from("performance").select("*");
  // ...
}
```

**클라이언트 컴포넌트에서:**
```typescript
"use client";
import { createClient } from "@/lib/supabase/client";

export default function Component() {
  const supabase = createClient();
  // ...
}
```

## 배포

Vercel에 배포할 때는 환경 변수를 Vercel 프로젝트 설정에 추가하세요.

## 라이선스

Private
