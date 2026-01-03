"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth/auth";
import { getGuestId } from "@/lib/utils/guest";
import { ensureUserExists } from "@/lib/auth/ensure-user";
import { ensureGuestExists } from "@/lib/utils/ensure-guest";
import RatingInput from "@/components/rating/RatingInput";
import { normalizeRating } from "@/lib/utils/rating";
import { Performance, Evaluation } from "@/types";
import NoEvaluationsModal from "@/components/evaluation/NoEvaluationsModal";
import EvaluationCompleteModal from "@/components/evaluation/EvaluationCompleteModal";
import AuthModal from "@/components/auth/AuthModal";
import StatsBanner from "@/components/layout/StatsBanner";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { getPerformanceCreators, formatCreators } from "@/lib/utils/performance-creators";
import CreatorInfo from "@/components/performance/CreatorInfo";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * 공연 평가 입력 화면
 * - 좌우 스크롤로 다음/이전 공연 이동
 * - 별점/하트 모두 입력하면 자동으로 다음 공연으로
 * - 평가하지 않은 공연만 표시
 * - 와이어프레임 기반 UI
 */
export default function EvaluatePage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  // 상태 관리: loading / ready / empty를 하나의 status로 통합
  type PageStatus = "loading" | "ready" | "empty";
  const [status, setStatus] = useState<PageStatus>("loading");
  
  const [allPerformances, setAllPerformances] = useState<Performance[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [evaluations, setEvaluations] = useState<
    Record<string, { starRating: number; likeRating: number }>
  >({});
  const [savedEvaluations, setSavedEvaluations] = useState<
    Record<string, Evaluation>
  >({});
  const [totalEvaluated, setTotalEvaluated] = useState(0);
  // 클라이언트 단에서만 관리하는 실시간 평가 카운트 (DB와 별도)
  const [clientTotalEvaluated, setClientTotalEvaluated] = useState(0);
  // 완료된 평가를 추적하는 Set (처음 완료될 때만 카운트 증가)
  const [completedEvaluations, setCompletedEvaluations] = useState<Set<string>>(new Set());
  const [posterUrls, setPosterUrls] = useState<Record<string, string | null>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasEvaluatedInSession, setHasEvaluatedInSession] = useState(false);
  const [creators, setCreators] = useState<Record<string, { writer: string | null; composer: string | null }>>({});
  const [showNoEvaluationsModal, setShowNoEvaluationsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 사용자 인증 상태 확인
  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
        setUserId(user.id);
      } else {
        // Guest ID 사용
        const guestId = getGuestId();
        setUserId(guestId);
      }
    }
    checkAuth();
  }, []);

  // 모든 데이터 fetch 및 상태 결정을 하나의 useEffect에서 처리
  useEffect(() => {
    async function loadAllData() {
      setStatus("loading");
      
      try {
        // 인증된 사용자 또는 Guest ID 확인
        const user = await getCurrentUser();
        const currentUserId = user?.id || getGuestId();
        if (!currentUserId) {
          setStatus("empty");
          return;
        }

        const supabase = createClient();

        // 1. 공연 목록 로드 (poster_url 포함)
        const { data: allPerfs, error: perfError } = await supabase
          .from("performance")
          .select("*")
          .order("created_at", { ascending: false });

        if (perfError) throw perfError;
        const allPerfsData = (allPerfs || []) as any[];

        if (allPerfsData.length === 0) {
          setAllPerformances([]);
          setPerformances([]);
          setStatus("empty");
          return;
        }

        setAllPerformances(allPerfsData as Performance[]);

        // 2. 포스터 및 작가/작곡가 정보 로드
        const urls: Record<string, string | null> = {};
        const creatorsData: Record<string, { writer: string | null; composer: string | null }> = {};

        for (const performance of allPerfsData) {
          // 포스터 URL 로드: performance.poster_url만 사용
          const posterUrl: string | null = performance.poster_url ?? null;

          urls[performance.id] = posterUrl;
          console.log(`[Poster] Performance ${performance.id} (${performance.title}): poster_url =`, posterUrl);

          // 작가/작곡가 정보 로드
          const creatorsList = await getPerformanceCreators(supabase, performance.id);
          creatorsData[performance.id] = formatCreators(creatorsList);
        }

        setPosterUrls(urls);
        setCreators(creatorsData);

        // 3. 기존 평가 로드 (performance 기준)
        // 인증된 사용자 또는 Guest에 따라 다르게 조회
        let allUserEvaluations = null;
        if (user) {
          // 인증된 사용자: user_id 기준
          const { data } = await supabase
            .from("evaluation")
            .select("*")
            .eq("user_id", user.id)
            .is("guest_id", null);
          allUserEvaluations = data;
        } else {
          // Guest: guest_id 기준
          const guestId = getGuestId();
          if (guestId) {
            const { data } = await supabase
              .from("evaluation")
              .select("*")
              .eq("guest_id", guestId)
              .is("user_id", null);
            allUserEvaluations = data;
          }
        }

        const evaluationsMap: Record<string, Evaluation> = {};
        const evaluatedPerformanceIdSet = new Set<string>();
        
        if (allUserEvaluations) {
          for (const evaluation of allUserEvaluations) {
            const perfId = (evaluation as any).performance_id;
            if (perfId) {
              evaluatedPerformanceIdSet.add(perfId);
              evaluationsMap[perfId] = evaluation as Evaluation;
            }
          }
        }

        setSavedEvaluations(evaluationsMap);
        setTotalEvaluated(evaluatedPerformanceIdSet.size);
        setClientTotalEvaluated(evaluatedPerformanceIdSet.size);
        // 이미 완료된 평가들을 Set에 추가
        setCompletedEvaluations(new Set(Array.from(evaluatedPerformanceIdSet)));

        // 4. 평가하지 않은 공연 필터링
        const unevaluatedPerformances = allPerfsData.filter((p) =>
          !evaluatedPerformanceIdSet.has(p.id)
        );

        setPerformances(unevaluatedPerformances);

        // 5. 상태 결정 (fetch 완료 후 단 한 번만)
        if (unevaluatedPerformances.length === 0) {
          setStatus("empty");
          if (allPerfsData.length > 0) {
            setShowNoEvaluationsModal(true);
          }
        } else {
          setStatus("ready");
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        setStatus("empty");
      }
    }

    loadAllData();
  }, [router]);

  // 스크롤 애니메이션
  const scrollToIndex = (index: number) => {
    if (!containerRef.current || isAnimating) return;
    
    setIsAnimating(true);
    const container = containerRef.current;
    const card = container.children[index] as HTMLElement;
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // currentIndex 변경 시 스크롤
  useEffect(() => {
    if (performances.length > 0 && currentIndex < performances.length) {
      scrollToIndex(currentIndex);
    }
  }, [currentIndex, performances.length]);

  // 모든 공연 평가 완료 시 (세션 중 평가를 완료한 경우에만 처리)
  useEffect(() => {
    if (status === "ready" && performances.length === 0 && allPerformances.length > 0 && hasEvaluatedInSession && !showAuthModal) {
      checkAndShowCompleteModal();
    }
  }, [status, performances.length, allPerformances.length, hasEvaluatedInSession, showAuthModal]);

  const handleRatingChange = async (
    performanceId: string,
    type: "star" | "like",
    value: number
  ) => {
    const current = evaluations[performanceId] || {
      starRating: 0,
      likeRating: 0,
    };
    const newState = {
      ...current,
      [type === "star" ? "starRating" : "likeRating"]: value,
    };

    setEvaluations((prev) => ({
      ...prev,
      [performanceId]: newState,
    }));

    // 둘 다 0보다 크면 "완료" 처리 (단 1번만)
    if (newState.starRating > 0 && newState.likeRating > 0) {
      // 이미 완료된 평가인지 확인
      const isAlreadyCompleted = completedEvaluations.has(performanceId);
      
      if (!isAlreadyCompleted) {
        // 처음 완료 처리: 완료 Set에 추가하고 카운트 +1
        setCompletedEvaluations((prev) => {
          const newSet = new Set(prev);
          newSet.add(performanceId);
          return newSet;
        });
        setClientTotalEvaluated((prev) => prev + 1);
      }

      // DB 저장은 비동기로 처리 (UI 상태와 분리)
      handleSaveEvaluation(performanceId).catch((error) => {
        console.error("[Evaluation] ❌ Failed to save evaluation:", error);
      });

      // 완료된 순간 다음 공연으로 이동 (DB 저장 완료를 기다리지 않음)
      setTimeout(() => {
        const currentPerformanceIndex = (performances as Performance[]).findIndex(
          (p) => p.id === performanceId
        );
        if (currentPerformanceIndex < performances.length - 1) {
          setCurrentIndex(currentPerformanceIndex + 1);
        } else {
          // 마지막 공연이면 완료 모달 표시
          setHasEvaluatedInSession(true);
          checkAndShowCompleteModal();
        }
      }, 300);
    }
  };

  const handleNotSeen = async (performanceId: string) => {
    // 점수 0으로 리셋
    setEvaluations((prev) => ({
      ...prev,
      [performanceId]: {
        starRating: 0,
        likeRating: 0,
      },
    }));

    // 완료 Set에서 제거 (리셋된 경우)
    setCompletedEvaluations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(performanceId)) {
        newSet.delete(performanceId);
        setClientTotalEvaluated((count) => Math.max(0, count - 1));
      }
      return newSet;
    });

    // 다음 공연으로 이동 (완료로 평가하지 않음)
    const currentPerformanceIndex = (performances as Performance[]).findIndex(
      (p) => p.id === performanceId
    );
    if (currentPerformanceIndex < performances.length - 1) {
      setCurrentIndex(currentPerformanceIndex + 1);
    } else {
      // 마지막 공연이면 평가 완료 모달 표시
      setHasEvaluatedInSession(true);
      checkAndShowCompleteModal();
    }
  };

  const checkAndShowCompleteModal = async () => {
    // DB에서 실제 총 평가 수 가져오기
    try {
      const supabase = createClient();
      const user = await getCurrentUser();
      
      let totalCount = 0;
      if (user) {
        // 인증된 사용자: user_id 기준
        const { data: allEvaluations } = await supabase
          .from("evaluation")
          .select("id")
          .eq("user_id", user.id)
          .is("guest_id", null);
        totalCount = allEvaluations?.length || 0;
      } else {
        // Guest: guest_id 기준
        const guestId = getGuestId();
        if (guestId) {
          const { data: allEvaluations } = await supabase
            .from("evaluation")
            .select("id")
            .eq("guest_id", guestId)
            .is("user_id", null);
          totalCount = allEvaluations?.length || 0;
        }
      }

      setTotalEvaluated(totalCount);
      
      // 로그인된 사용자도 평가 완료 모달 표시
      if (user) {
        // 로그인된 사용자: 평가 완료 모달 표시 (예전 팝업)
        setShowCompleteModal(true);
      } else {
        // Guest인 경우 AuthModal 표시
        setShowAuthModal(true);
      }
    } catch (error) {
      console.error("Failed to load total evaluations:", error);
      // 에러 발생 시에도 Guest인 경우 AuthModal 표시
      const user = await getCurrentUser();
      if (!user) {
        setShowAuthModal(true);
      } else {
        router.push("/my-evaluations");
      }
    }
  };

  const handleSaveEvaluation = async (performanceId: string): Promise<boolean> => {
    console.log("[Evaluation] 🚀 handleSaveEvaluation START", {
      performanceId,
      evaluation: evaluations[performanceId],
      timestamp: new Date().toISOString(),
    });

    const evaluation = evaluations[performanceId];
    if (!evaluation || evaluation.starRating === 0 || evaluation.likeRating === 0) {
      console.log("[Evaluation] ⛔ Early return: Invalid evaluation data", {
        evaluation,
        starRating: evaluation?.starRating,
        likeRating: evaluation?.likeRating,
      });
      return false;
    }

    try {
      console.log("[Evaluation] 📦 Creating Supabase client...");
      const supabase = createClient();
      console.log("[Evaluation] ✅ Supabase client created", {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      });

      // 인증된 사용자 또는 Guest ID 확인
      const user = await getCurrentUser();
      const currentUserId = user?.id || getGuestId();
      const isGuest = !user;
      
      console.log("[Evaluation] 👤 User ID:", currentUserId, "isGuest:", isGuest);
      if (!currentUserId) {
        console.log("[Evaluation] ⛔ No user ID or guest ID");
        return false;
      }

      // 인증된 사용자인 경우, public.user 테이블에 사용자가 존재하는지 확인하고 없으면 생성
      if (!isGuest && user) {
        const userExists = await ensureUserExists(supabase, user.id, user.email || undefined);
        if (!userExists) {
          console.error("[Evaluation] ⛔ Failed to ensure user exists in public.user table");
          throw new Error("사용자 정보를 저장할 수 없습니다. 다시 시도해주세요.");
        }
      } else if (isGuest) {
        // Guest인 경우, public.guest 테이블에 Guest가 존재하는지 확인하고 없으면 생성
        const guestExists = await ensureGuestExists(supabase, currentUserId);
        if (!guestExists) {
          console.error("[Evaluation] ⛔ Failed to ensure guest exists in public.guest table");
          throw new Error("게스트 정보를 저장할 수 없습니다. 다시 시도해주세요.");
        }
      }

      const normalizedStar = normalizeRating(evaluation.starRating);
      const normalizedLike = normalizeRating(evaluation.likeRating);
      console.log("[Evaluation] 📊 Ratings normalized", {
        original: { star: evaluation.starRating, like: evaluation.likeRating },
        normalized: { star: normalizedStar, like: normalizedLike },
      });

      // user_id 또는 guest_id + performance_id로 기존 평가 찾기 (season_id 무시)
      console.log("[Evaluation] 🔍 Checking for existing evaluation...", {
        userId: currentUserId,
        isGuest,
        performanceId,
        performanceIdType: typeof performanceId,
        performanceIdLength: performanceId?.length,
      });
      
      let existingEval;
      let checkError;
      
      if (isGuest) {
        // Guest: guest_id 기준
        const result = await supabase
          .from("evaluation")
          .select("*")
          .eq("guest_id", currentUserId)
          .eq("performance_id", performanceId)
          .maybeSingle();
        existingEval = result.data;
        checkError = result.error;
      } else {
        // 인증된 사용자: user_id 기준
        const result = await supabase
          .from("evaluation")
          .select("*")
          .eq("user_id", currentUserId)
          .eq("performance_id", performanceId)
          .maybeSingle();
        existingEval = result.data;
        checkError = result.error;
      }
      
      console.log("[Evaluation] 🔍 Existing evaluation check result:", {
        existingEval,
        checkError,
        hasExisting: !!existingEval,
        checkErrorCode: checkError?.code,
        checkErrorMessage: checkError?.message,
        checkErrorDetails: checkError?.details,
      });

      // season_id는 MVP에서 평가 기준이 아니므로 사용하지 않음
      // evaluation 테이블의 season_id는 nullable이므로 포함하지 않거나 null로 저장

      if (existingEval) {
        // 기존 평가 업데이트 (user_id + performance_id 기준)
        console.log("[Evaluation] 🔄 UPDATE path - Updating existing evaluation", {
          evaluationId: (existingEval as any).id,
          performanceId,
          ratings: { star: normalizedStar, like: normalizedLike },
          existingEvalFull: existingEval,
        });
        
        const updatePayload = {
          star_rating: normalizedStar,
          like_rating: normalizedLike,
          updated_at: new Date().toISOString(),
        };
        
        console.log("[Evaluation] 🔄 UPDATE payload:", updatePayload);
        
        const { data: updatedData, error: updateError } = await (supabase
          .from("evaluation") as any)
          .update(updatePayload)
          .eq("id", (existingEval as any).id)
          .select();
        
        console.log("[Evaluation] 🔄 UPDATE request result:", {
          updatedData,
          updateError,
          dataLength: updatedData?.length,
          errorCode: updateError?.code,
          errorMessage: updateError?.message,
          errorDetails: updateError?.details,
          errorHint: updateError?.hint,
        });

        if (updateError) {
          console.error("[Evaluation] ❌ Update error:", updateError);
          console.error("[Evaluation] Update details:", {
            evaluationId: (existingEval as any).id,
            performanceId,
            starRating: normalizedStar,
            likeRating: normalizedLike,
          });
          
          // UPDATE 실패 시 (평가가 삭제되었을 수 있음) INSERT 시도
          console.log("[Evaluation] Update failed, attempting INSERT instead...");
          
          // INSERT로 전환
          const insertPayload = isGuest
            ? {
                user_id: null,
                guest_id: currentUserId,
                season_id: null,
                performance_id: performanceId,
                star_rating: normalizedStar,
                like_rating: normalizedLike,
                comment: null,
              }
            : {
                user_id: currentUserId,
                guest_id: null,
                season_id: null,
                performance_id: performanceId,
                star_rating: normalizedStar,
                like_rating: normalizedLike,
                comment: null,
              };
          
          const { data: insertedData, error: insertError } = await supabase
            .from("evaluation")
            .insert(insertPayload as any)
            .select();

          if (insertError) {
            console.error("[Evaluation] ❌ Insert error after update failure:", insertError);
            throw new Error(`Failed to insert evaluation after update failure: ${insertError.message || JSON.stringify(insertError)}`);
          }

          console.log("[Evaluation] ✅ Insert success (after update failure):", {
            performanceId,
            insertedData,
          });

          // savedEvaluations 업데이트
          if (insertedData && insertedData.length > 0) {
            setSavedEvaluations((prev) => ({
              ...prev,
              [performanceId]: insertedData[0] as Evaluation,
            }));
          }

          setHasEvaluatedInSession(true);
          return true;
        }

        console.log("[Evaluation] ✅ Update success:", {
          evaluationId: (existingEval as any).id,
          performanceId,
          updatedData,
        });

        // savedEvaluations 업데이트 (중복 방지)
        setSavedEvaluations((prev) => ({
          ...prev,
          [performanceId]: updatedData?.[0] || existingEval,
        }));

        setHasEvaluatedInSession(true);
        return true;
      } else {
        // 새 평가 생성
        console.log("[Evaluation] ➕ INSERT path - Creating new evaluation", {
          performanceId,
          performanceIdType: typeof performanceId,
          performanceIdLength: performanceId?.length,
          userId: currentUserId,
          userIdType: typeof currentUserId,
          ratings: { star: normalizedStar, like: normalizedLike },
        });
        
        const insertPayload = isGuest
          ? {
              user_id: null,
              guest_id: currentUserId,
              season_id: null,
              performance_id: performanceId,
              star_rating: normalizedStar,
              like_rating: normalizedLike,
              comment: null,
            }
          : {
              user_id: currentUserId,
              guest_id: null,
              season_id: null,
              performance_id: performanceId,
              star_rating: normalizedStar,
              like_rating: normalizedLike,
              comment: null,
            };
        
        console.log("[Evaluation] ➕ INSERT payload (full):", JSON.stringify(insertPayload, null, 2));
        console.log("[Evaluation] ➕ INSERT payload (values check):", {
          user_id: insertPayload.user_id,
          user_id_is_null: insertPayload.user_id === null,
          user_id_is_undefined: insertPayload.user_id === undefined,
          performance_id: insertPayload.performance_id,
          performance_id_is_null: insertPayload.performance_id === null,
          performance_id_is_undefined: insertPayload.performance_id === undefined,
          star_rating: insertPayload.star_rating,
          like_rating: insertPayload.like_rating,
        });
        
        const { data: insertedData, error: insertError } = await supabase
          .from("evaluation")
          .insert(insertPayload as any)
          .select();
        
        console.log("[Evaluation] ➕ INSERT request result:", {
          insertedData,
          insertError,
          dataLength: insertedData?.length,
          errorCode: insertError?.code,
          errorMessage: insertError?.message,
          errorDetails: insertError?.details,
          errorHint: insertError?.hint,
          fullError: insertError ? JSON.stringify(insertError, null, 2) : null,
        });

        if (insertError) {
          console.error("[Evaluation] ❌ Insert error:", insertError);
          console.error("[Evaluation] Insert details:", {
            performanceId,
            starRating: normalizedStar,
            likeRating: normalizedLike,
          });
          
          // UNIQUE 제약 조건 위반 시 (이미 평가가 존재하는 경우) UPDATE 시도
          if (insertError.code === "23505") {
            console.log("[Evaluation] Insert failed due to unique constraint, attempting UPDATE instead...");
            
            // 기존 평가 다시 조회
            let existingEvalRetry;
            if (isGuest) {
              const result = await supabase
                .from("evaluation")
                .select("*")
                .eq("guest_id", currentUserId)
                .eq("performance_id", performanceId)
                .maybeSingle();
              existingEvalRetry = result.data;
            } else {
              const result = await supabase
                .from("evaluation")
                .select("*")
                .eq("user_id", currentUserId)
                .eq("performance_id", performanceId)
                .maybeSingle();
              existingEvalRetry = result.data;
            }
            
            if (existingEvalRetry) {
              const { data: updatedData, error: updateError } = await (supabase
                .from("evaluation") as any)
                .update({
                  star_rating: normalizedStar,
                  like_rating: normalizedLike,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", (existingEvalRetry as any).id)
                .select();

              if (updateError) {
                console.error("[Evaluation] ❌ Update error after insert failure:", updateError);
                throw new Error(`Failed to update evaluation after insert failure: ${updateError.message || JSON.stringify(updateError)}`);
              }

              console.log("[Evaluation] ✅ Update success (after insert failure):", {
                evaluationId: (existingEvalRetry as any).id,
                performanceId,
                updatedData,
              });

              // savedEvaluations 업데이트
              setSavedEvaluations((prev) => ({
                ...prev,
                [performanceId]: updatedData?.[0] || existingEvalRetry,
              }));

              setHasEvaluatedInSession(true);
              return true;
            }
          }
          
          // 다른 에러의 경우 throw하여 상위에서 처리
          throw new Error(`Failed to insert evaluation: ${insertError.message || JSON.stringify(insertError)}`);
        }

        console.log("[Evaluation] ✅ Insert success:", {
          performanceId,
          insertedData,
        });

        // savedEvaluations 업데이트 (중복 방지)
        if (insertedData && insertedData.length > 0) {
          setSavedEvaluations((prev) => ({
            ...prev,
            [performanceId]: insertedData[0] as Evaluation,
          }));
        }
        
        // 평가 저장 완료 (목록에서 제거하지 않음 - 최종 저장 전까지 유지)
        setHasEvaluatedInSession(true);
        return true;
      }
    } catch (error) {
      console.error("[Evaluation] ❌ CRITICAL ERROR in handleSaveEvaluation:", error);
      console.error("[Evaluation] Error stack:", (error as Error).stack);
      console.error("[Evaluation] Error details:", {
        name: (error as Error).name,
        message: (error as Error).message,
        performanceId,
      });
      console.error("[Evaluation] Full error object:", JSON.stringify(error, null, 2));
      // 에러를 다시 throw하여 상위에서 처리할 수 있도록 함
      throw error;
    }
    
    console.log("[Evaluation] 🏁 handleSaveEvaluation END (SUCCESS)", {
      performanceId,
      timestamp: new Date().toISOString(),
    });
    return true;
  };

  const handleComplete = async () => {
    console.log("[Evaluation] 🎬 handleComplete START", {
      evaluationsCount: Object.keys(evaluations).length,
      evaluations: Object.keys(evaluations).map(id => ({
        id,
        star: evaluations[id].starRating,
        like: evaluations[id].likeRating,
      })),
    });
    
    // 아직 저장되지 않은 평가들 저장
    const saveResults: Array<{ performanceId: string; success: boolean; error?: string }> = [];
    
    for (const performanceId of Object.keys(evaluations)) {
      const evaluationData = evaluations[performanceId];
      if (evaluationData.starRating > 0 && evaluationData.likeRating > 0) {
        console.log("[Evaluation] 💾 Saving evaluation from handleComplete", { performanceId });
        try {
          const success = await handleSaveEvaluation(performanceId);
          if (success) {
            setHasEvaluatedInSession(true);
            saveResults.push({ performanceId, success: true });
            console.log("[Evaluation] ✅ Successfully saved evaluation", { performanceId });
          } else {
            saveResults.push({ performanceId, success: false, error: "Failed to save" });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error("[Evaluation] ❌ Failed to save evaluation", {
            performanceId,
            error: errorMessage,
          });
          saveResults.push({ performanceId, success: false, error: errorMessage });
          // 하나가 실패해도 나머지는 계속 저장 시도
        }
      }
    }
    
    console.log("[Evaluation] 📊 Save results summary:", {
      total: saveResults.length,
      successful: saveResults.filter(r => r.success).length,
      failed: saveResults.filter(r => !r.success).length,
      results: saveResults,
    });
    await checkAndShowCompleteModal();
    
    console.log("[Evaluation] 🎬 handleComplete END");
  };

  // handleFinalSave는 더 이상 사용하지 않음 (checkAndShowCompleteModal에서 처리)

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // 비로그인 상태에서 회원가입/로그인 완료 후에는 EvaluationCompleteModal을 표시하지 않음
    // 로그인된 상태에서 평가를 완료했을 때만 EvaluationCompleteModal이 표시됨
    // 여기서는 AuthModal만 닫고 평가 화면을 유지하거나, '내 평가' 화면으로 이동
    router.push("/my-evaluations");
  };


  const handleCompleteModalConfirm = async () => {
    // 실제 DB에서 총 평가 수를 조회하여 업데이트
    try {
      const supabase = createClient();
      const user = await getCurrentUser();
      
      let totalCount = 0;
      if (user) {
        // 인증된 사용자: user_id 기준
        const { data: allEvaluations } = await supabase
          .from("evaluation")
          .select("id")
          .eq("user_id", user.id)
          .is("guest_id", null);
        totalCount = allEvaluations?.length || 0;
      } else {
        // Guest: guest_id 기준
        const guestId = getGuestId();
        if (guestId) {
          const { data: allEvaluations } = await supabase
            .from("evaluation")
            .select("id")
            .eq("guest_id", guestId)
            .is("user_id", null);
          totalCount = allEvaluations?.length || 0;
        }
      }
      
      // DB의 실제 총 평가 수로 업데이트
      setTotalEvaluated(totalCount);
      setClientTotalEvaluated(totalCount);
    } catch (error) {
      console.error("Failed to load total evaluations:", error);
    }
    
    setShowCompleteModal(false);
    router.push("/my-evaluations");
  };

  const handlePrev = () => {
    if (currentIndex > 0 && !isAnimating) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < performances.length - 1 && !isAnimating) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // 상태 기반 조건부 렌더링
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-600">로딩 중...</p>
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-600">평가할 공연이 없습니다.</p>
        {showNoEvaluationsModal && (
          <NoEvaluationsModal
            isOpen={showNoEvaluationsModal}
            onClose={() => {
              setShowNoEvaluationsModal(false);
              router.push("/");
            }}
          />
        )}
      </div>
    );
  }

  if (status === "ready" && performances.length === 0 && allPerformances.length > 0 && hasEvaluatedInSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-600">처리 중...</p>
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => {
              setShowAuthModal(false);
              // 팝업만 닫고 평가하기 화면 유지 (라우팅 없음)
            }}
            onSuccess={handleAuthSuccess}
            totalEvaluations={totalEvaluated}
            mode="signup"
            onTotalUpdate={(count) => {
              setTotalEvaluated(count);
            }}
          />
        )}
        {showCompleteModal && (
          <EvaluationCompleteModal
            totalCount={totalEvaluated}
            onConfirm={handleCompleteModalConfirm}
            onClose={() => {
              setShowCompleteModal(false);
              // 팝업만 닫고 평가하기 화면 유지 (라우팅 없음)
            }}
          />
        )}
      </div>
    );
  }

  if (!userId || status !== "ready" || performances.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-600">로딩 중...</p>
      </div>
    );
  }

  const currentPerformance = performances[currentIndex];
  const displayUserId = userId.substring(0, 8);

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 ID 표시 */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-sm text-zinc-600">ID: {displayUserId}</p>
      </div>

      {/* 상단 통계 */}
      <StatsBanner
        rank="상위 3%"
        count={clientTotalEvaluated}
      />

      {/* 스크롤 가능한 공연 카드 영역 */}
      <div className="relative mb-20">
        <div
          ref={containerRef}
          className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {performances.map((performance, index) => (
            <div
              key={performance.id}
              className="relative min-w-full snap-start"
            >
              <div className="px-4">
                {/* 포스터 */}
                <div className="relative mb-6 flex justify-center">
                  <div className="relative w-full max-w-sm">
                    {/* 이전 공연 미리보기 (왼쪽) */}
                    {index > 0 && (
                      <div className="absolute -left-20 top-0 h-full w-12 overflow-hidden opacity-30">
                        <PosterImage
                          posterUrl={posterUrls[performances[index - 1].id]}
                          title={performances[index - 1].title}
                          isPreview
                        />
                      </div>
                    )}

                    {/* 메인 포스터 */}
                    <div className="relative">
                      <PosterImage
                        posterUrl={posterUrls[performance.id]}
                        title={performance.title}
                      />
                      
                      {/* 좌우 화살표 버튼 */}
                      {index > 0 && (
                        <button
                          onClick={handlePrev}
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-colors hover:bg-white"
                          aria-label="이전 공연"
                        >
                          <ChevronLeft className="h-5 w-5 text-zinc-600" />
                        </button>
                      )}
                      {index < performances.length - 1 && (
                        <button
                          onClick={handleNext}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-colors hover:bg-white"
                          aria-label="다음 공연"
                        >
                          <ChevronRight className="h-5 w-5 text-zinc-600" />
                        </button>
                      )}
                    </div>

                    {/* 다음 공연 미리보기 (오른쪽) */}
                    {index < performances.length - 1 && (
                      <div className="absolute -right-20 top-0 h-full w-12 overflow-hidden opacity-30">
                        <PosterImage
                          posterUrl={posterUrls[performances[index + 1].id]}
                          title={performances[index + 1].title}
                          isPreview
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 평가 입력 영역 */}
                <div className="pb-6">
                  <EvaluationCard
                    performance={performance}
                    starRating={evaluations[performance.id]?.starRating || 0}
                    likeRating={evaluations[performance.id]?.likeRating || 0}
                    creators={creators[performance.id] || { writer: null, composer: null }}
                    onStarChange={(value) =>
                      handleRatingChange(performance.id, "star", value)
                    }
                    onLikeChange={(value) =>
                      handleRatingChange(performance.id, "like", value)
                    }
                    onNotSeen={() => handleNotSeen(performance.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 버튼 (고정) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white p-4">
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleComplete}
        >
          평가 끝내고 결과 확인하기
        </Button>
      </div>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            // 팝업만 닫고 평가하기 화면 유지 (라우팅 없음)
          }}
          onSuccess={handleAuthSuccess}
          totalEvaluations={totalEvaluated}
          mode="signup"
          onTotalUpdate={(count) => {
            setTotalEvaluated(count);
          }}
        />
      )}

      {showCompleteModal && (
        <EvaluationCompleteModal
          totalCount={totalEvaluated}
          onConfirm={handleCompleteModalConfirm}
          onClose={() => {
            setShowCompleteModal(false);
            // 팝업만 닫고 평가하기 화면 유지
          }}
        />
      )}

      {showNoEvaluationsModal && (
        <NoEvaluationsModal
          isOpen={showNoEvaluationsModal}
          onClose={() => {
            setShowNoEvaluationsModal(false);
            router.push("/");
          }}
        />
      )}
    </div>
  );
}

function PosterImage({
  posterUrl,
  title,
  isPreview = false,
}: {
  posterUrl: string | null;
  title: string;
  isPreview?: boolean;
}) {
  return (
        <div
          className={`overflow-hidden rounded-lg bg-zinc-200 ${
            isPreview ? "aspect-[2/3] h-full" : "aspect-[2/3] w-full max-w-sm"
          }`}
        >
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={title}
          width={400}
          height={600}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
          <svg
            className={`text-zinc-400 ${isPreview ? "h-8 w-8" : "h-24 w-24"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

function EvaluationCard({
  performance,
  starRating,
  likeRating,
  creators,
  onStarChange,
  onLikeChange,
  onNotSeen,
}: {
  performance: Performance;
  starRating: number;
  likeRating: number;
  creators: { writer: string | null; composer: string | null };
  onStarChange: (value: number) => void;
  onLikeChange: (value: number) => void;
  onNotSeen: () => void;
}) {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="mb-2 text-2xl font-bold text-black">{performance.title}</h1>
      
      {/* 극본/작곡 정보 */}
      <div className="mb-6 flex justify-center">
        <CreatorInfo
          writer={creators.writer}
          composer={creators.composer}
        />
      </div>

      <div className="space-y-6">
        <div className="flex justify-center">
          <RatingInput
            label="잘 만들었나요?"
            value={starRating}
            onChange={onStarChange}
            icon="star"
          />
        </div>

        <div className="flex justify-center">
          <RatingInput
            label="좋아하나요?"
            value={likeRating}
            onChange={onLikeChange}
            icon="heart"
          />
        </div>
      </div>

      {/* 안봤어요 버튼 */}
      <button
        onClick={onNotSeen}
        className="mt-4 text-sm text-zinc-500 hover:text-zinc-700"
      >
        안봤어요
      </button>
    </div>
  );
}
