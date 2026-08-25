import Constants from "expo-constants";
import type { Beat, LicenseTierId } from "./models";

const configuredApiUrl =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "https://www.vylanous.com";

export const API_BASE_URL = configuredApiUrl.replace(/\/$/, "");
let customerToken: string | null = null;

export function setCustomerToken(token: string | null) {
  customerToken = token;
}

export function getCustomerToken() {
  return customerToken;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Something went wrong. Please try again.");
  }
  return payload;
}

function absoluteAssetUrl(value: string): string {
  if (!value || /^https?:\/\//i.test(value)) return value;
  return new URL(value.startsWith("/") ? value : `/${value}`, `${API_BASE_URL}/`).toString();
}

function normalizeBeat(beat: Beat): Beat {
  return {
    ...beat,
    artworkUrl: absoluteAssetUrl(beat.artworkUrl),
    audioUrl: absoluteAssetUrl(beat.audioUrl),
  };
}

export async function fetchBeats(): Promise<Beat[]> {
  const payload = await request<{ beats: Beat[] }>("/api/beats");
  return payload.beats.map(normalizeBeat);
}

export async function fetchFeaturedBeats(): Promise<Beat[]> {
  const payload = await request<{ beats: Beat[] }>("/api/beats/featured");
  return payload.beats.map(normalizeBeat);
}

export async function fetchBeat(slug: string): Promise<Beat> {
  const payload = await request<{ beat: Beat }>(`/api/beats/${encodeURIComponent(slug)}`);
  return normalizeBeat(payload.beat);
}

export async function trackPlay(beatId: string): Promise<void> {
  await request<{ ok: true }>(`/api/beats/${encodeURIComponent(beatId)}/play`, { method: "POST" });
}

const freeLicenseRequestKeys = new Map<string, string>();

export async function fulfillFreeLicense(input: { beatId: string }): Promise<{ orderId: string }> {
  const requestKey = input.beatId;
  const idempotencyKey =
    freeLicenseRequestKeys.get(requestKey) ||
    `mobile_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
  freeLicenseRequestKeys.set(requestKey, idempotencyKey);
  const result = await request<{ orderId: string }>("/api/checkout", {
    method: "POST",
    body: JSON.stringify({
      items: [{ beatId: input.beatId, tier: "free" }],
      idempotencyKey,
    }),
  });
  freeLicenseRequestKeys.delete(requestKey);
  return result;
}

export interface MobileFulfillmentRequest {
  platform: "apple" | "google";
  environment: "sandbox" | "production";
  transactionId: string;
  purchaseToken?: string;
  productId: string;
  beatId: string;
  tier: LicenseTierId;
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

export interface CustomerProfile {
  id: string;
  email: string;
  displayName: string;
  marketingOptIn: boolean;
  emailVerified: boolean;
  emailVerifiedAt?: string | null;
  createdAt?: string;
}

export interface CustomerEntitlement {
  id: string;
  orderId: string;
  beatId: string;
  beatTitle: string;
  licenseTier: LicenseTierId;
  licenseName: string;
  createdAt: string;
  downloadUrl: string;
}

export interface CustomerDashboard {
  customer: CustomerProfile;
  insights: { paidOrders: number; licensesOwned: number; totalSpentCents: number };
  orders: {
    id: string;
    status: string;
    totalCents: number;
    currency: string;
    createdAt: string;
    paidAt: string | null;
  }[];
  entitlements: CustomerEntitlement[];
}

type CustomerSessionResponse = {
  customer: CustomerProfile;
  session: { token: string; expiresAt: string };
};

export function customerLogin(input: { email: string; password: string }) {
  return request<CustomerSessionResponse>("/api/customer/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function customerRegister(input: {
  email: string;
  password: string;
  displayName?: string;
  marketingOptIn?: boolean;
}) {
  return request<CustomerSessionResponse>("/api/customer/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function resendCustomerVerification(email: string) {
  return request<{ ok: true; message: string }>("/api/customer/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyCustomerEmail(token: string) {
  return request<{ ok: true; customer: CustomerProfile }>("/api/customer/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function customerLogout() {
  return request<{ ok: true }>("/api/customer/logout", { method: "POST" });
}

export function customerDashboard() {
  return request<CustomerDashboard>("/api/customer/dashboard");
}

export function updateCustomerPreferences(input: {
  displayName?: string;
  marketingOptIn?: boolean;
}) {
  return request<{ customer: CustomerProfile }>("/api/customer/preferences", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function entitlementDownload(id: string) {
  return request<{ url: string }>(`/api/customer/entitlements/${encodeURIComponent(id)}/download`);
}
