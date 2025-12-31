# DB 설계 원칙 및 프론트엔드 구현 가이드

## DB 설계 원칙

### 1. 작가/작곡가 구조
- **작가(writer), 작곡가(composer)는 performance에 귀속**
- `person` / `performance_person` 구조 유지
- `performance_person.role`은 `'writer'`, `'composer'`로 제한
- `evaluation` / `performance_season` 구조는 MVP 기준 그대로 유지
- **중요**: season과 writer/composer는 절대 연결하지 않음

### 2. DB 제약 조건
- `performance_person.role`에 CHECK 제약: `role IN ('writer', 'composer')`
- 동일 `performance` + `role` 중복 방지: UNIQUE 제약 `(performance_id, role)`

## 프론트엔드 구현 규칙

### 1. 데이터 조회 패턴

**절대 하지 말 것:**
- ❌ season을 통한 간접 조회
- ❌ `performance_season` → `performance` → `performance_person` 경로 사용

**반드시 해야 할 것:**
- ✅ `performance` 기준으로 직접 조회
- ✅ `performance` → `performance_person` → `person` 경로 사용

### 2. 재사용 가능한 함수

#### 클라이언트 컴포넌트
```typescript
"use client";
import { createClient } from "@/lib/supabase/client";
import { getPerformanceCreators, formatCreators } from "@/lib/utils/performance-creators";

// Supabase 클라이언트 생성
const supabase = createClient();

// 작가/작곡가 정보 조회
const creators = await getPerformanceCreators(supabase, performanceId);

// UI 표시용 포맷팅
const { writer, composer } = formatCreators(creators);
```

#### 서버 컴포넌트
```typescript
import { createClient } from "@/lib/supabase/server";
import { getPerformanceCreators, formatCreators } from "@/lib/utils/performance-creators";

// Supabase 클라이언트 생성
const supabase = await createClient();

// 작가/작곡가 정보 조회
const creators = await getPerformanceCreators(supabase, performanceId);

// UI 표시용 포맷팅
const { writer, composer } = formatCreators(creators);
```

### 3. UI 컴포넌트

#### CreatorInfo 컴포넌트 사용
```typescript
import CreatorInfo from "@/components/performance/CreatorInfo";

<CreatorInfo
  writer={writer}
  composer={composer}
/>
```

### 4. 표시해야 하는 화면

다음 모든 화면에서 작가/작곡가를 표시해야 함:
- ✅ 공연 상세 페이지 (`app/performance/[performanceId]/page.tsx`)
- ✅ 평가 입력 화면 (`app/evaluate/page.tsx`)
- ✅ 내 평가 목록 (`app/my-evaluations/page.tsx`)
- ✅ 평가 수정 화면 (`app/my-evaluations/[evaluationId]/edit/page.tsx`)

## SQL 실행 순서

1. **제약 조건 설정**: `supabase_db_constraints.sql` 실행
2. **작가/작곡가 연결**: `supabase_insert_performance_creators.sql` 실행
   - 실행 전에 제외할 공연의 title을 SQL에 명시해야 함

## 파일 구조

```
lib/utils/
  └── performance-creators.ts    # 작가/작곡가 조회 유틸리티

components/performance/
  └── CreatorInfo.tsx            # 작가/작곡가 정보 표시 컴포넌트

supabase_db_constraints.sql      # DB 제약 조건 설정
supabase_insert_performance_creators.sql  # 작가/작곡가 연결 SQL
```

