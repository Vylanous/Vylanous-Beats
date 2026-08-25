export type PublishedBeatAnalyticsContext = {
  pageId: string;
  blockId: string;
};

type PublishedBeatMetricEvent = "card_click" | "preview_play";

const SESSION_STORAGE_KEY = "vylanous_published_beat_interactions_v1";
const MAX_INTERACTIONS_PER_SESSION = 50;

function canRecordInteraction(key: string): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const interactions = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
    if (interactions.has(key) || interactions.size >= MAX_INTERACTIONS_PER_SESSION) return false;
    interactions.add(key);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify([...interactions]));
  } catch {
    // Private browsing or unavailable session storage should not block the feature.
  }
  return true;
}

/**
 * Records only an aggregate page/block/beat interaction. It intentionally sends
 * no account, browser, IP, cart, or purchase information.
 */
export function trackPublishedBeatMetric(
  context: PublishedBeatAnalyticsContext | undefined,
  beatId: string,
  eventType: PublishedBeatMetricEvent,
) {
  if (!context || !beatId) return;
  const interactionKey = `${context.pageId}:${context.blockId}:${beatId}:${eventType}`;
  if (!canRecordInteraction(interactionKey)) return;
  const body = JSON.stringify({ ...context, beatId, eventType });
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(
        "/api/beats/published-block-event",
        new Blob([body], { type: "application/json" }),
      );
      return;
    }
  } catch {
    // Fall through to fetch. Tracking must never interrupt playback or navigation.
  }
  void fetch("/api/beats/published-block-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
