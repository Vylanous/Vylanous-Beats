export type PublishedBeatAnalyticsContext = {
  pageId: string;
  blockId: string;
};

type PublishedBeatMetricEvent = "card_click" | "preview_play";

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
