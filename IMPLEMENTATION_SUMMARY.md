# 구현 방향 정리 및 작업 요약

## 핵심 요구사항

1. **평가는 공연(performance) 단위로만 이루어짐**
   - 한 유저는 한 공연을 1번만 평가
   - 다시 평가하면 INSERT가 아니라 UPDATE

2. **시즌(season)은 MVP에서 완전히 무시**
   - season을 코드에서 자동 생성하거나 통일 season을 만드는 방식 사용 안 함
   - evaluation의 중복 기준: `user_id + performance_id` (또는 `guest_id + performance_id`)
   - `season_id`는 UNIQUE 조건이나 조회 조건에 포함하지 않음

3. **evaluation 테이블에 performance_id 컬럼 필수**
   - 이 컬럼을 기준으로 평가 중복 여부 판단

## 작업 완료 내역

### 1. Supabase SQL 실행 필요

**파일**: `supabase_add_performance_id_to_evaluation.sql`

**실행 내용**:
- `evaluation` 테이블에 `performance_id` 컬럼 추가
- 기존 데이터 마이그레이션 (season_id를 통해 performance_id 찾기)
- Foreign Key 제약 조건 추가
- 인덱스 추가 (조회 성능 향상)
- **UNIQUE 제약 조건**: `(user_id, performance_id)` 또는 `(guest_id, performance_id)`만 사용
- 기존 `season_id` 포함된 UNIQUE 제약 조건 제거

**실행 방법**:
1. Supabase Dashboard → SQL Editor 열기
2. `supabase_add_performance_id_to_evaluation.sql` 파일 내용 복사
3. 실행 후 확인 쿼리로 데이터 마이그레이션 확인

### 2. 삭제된 파일

- `lib/utils/unified-season.ts` - 통일된 season 생성 로직 제거

### 3. 수정된 파일

#### `app/evaluate/page.tsx`

**주요 변경사항**:
1. **season 관련 로직 완전 제거**
   - `getOrCreateUnifiedSeason`, `getSeasonIdForPerformance` import 제거
   - 통일된 season 생성/조회 로직 제거

2. **평가 조회 로직 변경**
   - 기존: `user_id + season_id + performance_id`로 조회
   - 변경: `user_id + performance_id`로만 조회 (season_id 무시)
   ```typescript
   // 변경 전
   .eq("user_id", currentUserId)
   .eq("season_id", unifiedSeasonId)
   .eq("performance_id", performance.id)

   // 변경 후
   .eq("user_id", currentUserId)
   // season_id 조건 제거
   ```

3. **평가 저장 로직 변경**
   - 기존 평가 찾기: `user_id + performance_id`로만 조회
   - season_id는 DB 제약 조건을 위해 필요하지만, 평가 로직에서는 무시
   - 기존 평가 있으면 UPDATE, 없으면 INSERT

4. **평가할 공연 판단 기준**
   - 전체 공연 목록 - (내가 평가한 공연 목록, performance 기준)
   - season 기준으로 필터링하지 않음

5. **모달 팝업 추가**
   - 평가할 공연이 없을 때 `NoEvaluationsModal` 표시
   - 확인 버튼으로 닫기 및 홈으로 이동

#### `app/my-evaluations/page.tsx`

**주요 변경사항**:
1. **평가 조회 로직 변경**
   - 기존: season을 통해 performance 찾기
   - 변경: `evaluation.performance_id` 직접 사용
   - season 관련 로직 제거

2. **중복 제거 로직 개선**
   - `performance_id` 기준으로만 중복 제거
   - 같은 performance에 대해 여러 평가가 있으면 가장 최근 것만 표시

### 4. 새로 추가된 파일

- `components/evaluation/NoEvaluationsModal.tsx` (이미 존재)
  - 평가할 공연이 없을 때 표시되는 모달

## 실행 순서

1. **Supabase SQL 실행** (필수)
   ```sql
   -- supabase_add_performance_id_to_evaluation.sql 실행
   ```

2. **기존 중복 평가 데이터 정리** (선택사항)
   ```sql
   -- 중복 평가 확인
   SELECT user_id, performance_id, COUNT(*) as count
   FROM evaluation
   WHERE user_id IS NOT NULL
   GROUP BY user_id, performance_id
   HAVING COUNT(*) > 1;
   
   -- 중복 제거 (가장 최근 것만 남기기)
   -- 필요시 수동으로 정리
   ```

3. **애플리케이션 테스트**
   - 평가 저장: 같은 공연을 다시 평가하면 UPDATE되는지 확인
   - 평가 조회: 평가한 공연 목록이 올바르게 표시되는지 확인
   - 평가할 공연 없을 때: 모달이 올바르게 표시되는지 확인

## 주의사항

1. **season_id는 여전히 DB에 존재**
   - DB 구조상 필수이므로 INSERT 시에는 필요
   - 하지만 평가 로직에서는 완전히 무시
   - MVP 이후 시즌별 평가로 확장 가능한 구조 유지

2. **performance_id가 없는 기존 평가**
   - SQL 마이그레이션으로 자동 처리
   - 마이그레이션 후에도 `performance_id`가 NULL인 평가가 있으면 수동 처리 필요

3. **UNIQUE 제약 조건**
   - `(user_id, performance_id)` 또는 `(guest_id, performance_id)`만 사용
   - `season_id`는 포함하지 않음

## 검증 체크리스트

- [ ] Supabase SQL 실행 완료
- [ ] `performance_id` 컬럼이 모든 평가에 추가되었는지 확인
- [ ] UNIQUE 제약 조건이 올바르게 설정되었는지 확인
- [ ] 같은 공연을 다시 평가하면 UPDATE되는지 확인
- [ ] 평가할 공연이 없을 때 모달이 표시되는지 확인
- [ ] 내 평가 화면에서 중복 공연이 표시되지 않는지 확인

