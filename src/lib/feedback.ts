import type { GameResult } from "../game/types";

export const FEEDBACK_EMAIL = "edsolarrcnt5@gmail.com";

type FeedbackSource = "home" | "result";

export function createFeedbackMailto(source: FeedbackSource, result?: GameResult): string {
  const subject = source === "home"
    ? "[수박수박수박박수박] 플레이 피드백"
    : "[수박수박수박박수박] 노동 결과 피드백";
  const context = result
    ? `\n\n[플레이 정보]\n점수: ${result.score}\n도달 스테이지: ${result.stageIndex + 1}\n소모 클레임: ${result.claims}\n선택 특성: ${result.selectedPerks.join(", ") || "없음"}`
    : "";
  const body = `안녕하세요! 게임을 플레이하고 남기는 의견입니다.\n\n좋았던 점:\n\n개선이 필요한 점:\n${context}`;

  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
