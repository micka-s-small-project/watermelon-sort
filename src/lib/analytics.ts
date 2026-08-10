import posthog from "posthog-js/dist/module.no-external";
import type { GameOverReason, PerkChoice, WatermelonType } from "../game/types";

type AnalyticsEventProperties = {
  game_started: { game_version: string; touch_capable: boolean };
  perk_offered: { stage: number; phase: PerkChoice["phase"]; options: readonly string[] };
  perk_selected: { stage: number; phase: PerkChoice["phase"]; perk: string; score: number; combo: number };
  claim_received: { stage: number; reason: "wrong_direction" | "timeout"; item_type: WatermelonType; combo: number; claim_consumed: boolean };
  stage_completed: { stage: number; score: number; combo: number; claims: number };
  game_finished: { reason: GameOverReason; reached_stage: number; score: number; duration_seconds: number; perks: readonly string[] };
  game_retried: { previous_reason: GameOverReason; previous_stage: number; previous_score: number };
  score_shared: { score: number; method: "native_share" | "clipboard" };
  tutorial_started: { total: number };
  tutorial_step_completed: { completed: number; total: number; first_attempt_correct: boolean };
  tutorial_completed: { total: number; first_attempt_correct: number };
  feedback_opened: { source: "home" | "result"; score?: number; stage?: number };
};

export type AnalyticsEventName = keyof AnalyticsEventProperties;

type AnalyticsTransport = {
  capture: <EventName extends AnalyticsEventName>(event: EventName, properties: AnalyticsEventProperties[EventName]) => void;
};

export function createAnalytics(transport?: AnalyticsTransport) {
  return {
    track<EventName extends AnalyticsEventName>(event: EventName, properties: AnalyticsEventProperties[EventName]) {
      transport?.capture(event, properties);
    },
  };
}

const projectKey = import.meta.env.VITE_POSTHOG_KEY;
const analyticsEnabled = import.meta.env.PROD && Boolean(projectKey);
let initialized = false;

const analytics = createAnalytics(analyticsEnabled ? {
  capture(event, properties) {
    try {
      if (!initialized) {
        posthog.init(projectKey!, {
          api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
          autocapture: false,
          capture_pageview: false,
          disable_session_recording: true,
        });
        initialized = true;
      }
      posthog.capture(event, properties);
    } catch {
      // Analytics must never interrupt a game run.
    }
  },
} : undefined);

export const trackEvent = analytics.track;
