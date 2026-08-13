import Constants from "expo-constants";
import type { Beat, LicenseTierId } from "./models";

const configuredApiUrl =
  Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "https://www.vylanous.com";

export const API_BASE_URL = configuredApiUrl.replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Something went wrong. Please try again.");
  }
  return payload;
}

export async function fetchBeats(): Promise<Beat[]> {
  const payload = await request<{ beats: Beat[] }>("/api/beats");
  return payload.beats;
}

export async function fetchFeaturedBeats(): Promise<Beat[]> {
  const payload = await request<{ beats: Beat[] }>("/api/beats/featured");
  return payload.beats;
}

export async function fetchBeat(slug: string): Promise<Beat> {
  const payload = await request<{ beat: Beat }>(`/api/beats/${encodeURIComponent(slug)}`);
  return payload.beat;
}

export async function trackPlay(beatId: string): Promise<void> {
  await request<{ ok: true }>(`/api/beats/${encodeURIComponent(beatId)}/play`, { method: "POST" });
}

export async function fulfillFreeLicense(input: { beatId: string; email: string; name?: string }): Promise<{ orderId: string }> {
  return request<{ orderId: string }>("/api/checkout", {
    method: "POST",
    body: JSON.stringify({ email: input.email, name: input.name ?? "", items: [{ beatId: input.beatId, tier: "free" }] }),
  });
}

export interface MobileFulfillmentRequest {
  platform: "apple" | "google";
  environment: "sandbox" | "production";
  transactionId: string;
  purchaseToken?: string;
  productId: string;
  beatId: string;
  tier: LicenseTierId;
  email: string;
  name?: string;
}

export interface MobileFulfillmentResponse {
  ok?: boolean;
  replay?: boolean;
  orderId: string;
  licenseTier?: string;
  message?: string;
}

export async function fulfillMobilePurchase(
  input: MobileFulfillmentRequest,
): Promise<MobileFulfillmentResponse> {
  return request<MobileFulfillmentResponse>("/api/mobile/purchases/verify-and-fulfill", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
