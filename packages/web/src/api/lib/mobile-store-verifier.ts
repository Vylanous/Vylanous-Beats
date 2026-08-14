import { AppStoreServerAPIClient, Environment } from "@apple/app-store-server-library";
import { GoogleAuth } from "google-auth-library";

export type MobileStorePlatform = "apple" | "google";
export type MobileStoreEnvironment = "sandbox" | "production";

export const MOBILE_LICENSE_PRODUCTS = {
  mp3: "com.vylanousbeats.license.mp3",
  wav: "com.vylanousbeats.license.wav",
  unlimited: "com.vylanousbeats.license.unlimited",
  exclusive: "com.vylanousbeats.license.exclusive",
} as const;

export type MobileLicenseTier = keyof typeof MOBILE_LICENSE_PRODUCTS;

export interface MobileStoreVerificationInput {
  platform: MobileStorePlatform;
  environment: MobileStoreEnvironment;
  transactionId: string;
  purchaseToken?: string;
  productId: string;
}

export interface VerifiedMobileStoreTransaction {
  platform: MobileStorePlatform;
  environment: MobileStoreEnvironment;
  transactionId: string;
  productId: string;
  purchaseToken: string;
  raw: Record<string, unknown>;
}

export class MobileStoreVerificationError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 409 | 422 | 503 = 422,
  ) {
    super(message);
  }
}

export function tierForMobileProduct(productId: string): MobileLicenseTier | null {
  return (
    (Object.entries(MOBILE_LICENSE_PRODUCTS).find(([, sku]) => sku === productId)?.[0] as
      | MobileLicenseTier
      | undefined) ?? null
  );
}

function appleEnvironment(environment: MobileStoreEnvironment): Environment {
  return environment === "sandbox" ? Environment.SANDBOX : Environment.PRODUCTION;
}

function decodeJwsPayload(compactJws: string): Record<string, unknown> {
  const [, payload] = compactJws.split(".");
  if (!payload) throw new MobileStoreVerificationError("Apple did not return a valid transaction.");
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    throw new MobileStoreVerificationError("Apple returned unreadable transaction data.");
  }
}

function appleClient(environment: MobileStoreEnvironment): AppStoreServerAPIClient {
  const privateKey = process.env.APPLE_IAP_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const keyId = process.env.APPLE_IAP_KEY_ID;
  const issuerId = process.env.APPLE_IAP_ISSUER_ID;
  const bundleId = process.env.APPLE_IAP_BUNDLE_ID;
  if (!privateKey || !keyId || !issuerId || !bundleId) {
    throw new MobileStoreVerificationError(
      "Apple mobile purchases are not configured on the server.",
      503,
    );
  }
  return new AppStoreServerAPIClient(privateKey, keyId, issuerId, bundleId, appleEnvironment(environment));
}

async function verifyApplePurchase(
  input: MobileStoreVerificationInput,
): Promise<VerifiedMobileStoreTransaction> {
  const response = await appleClient(input.environment).getTransactionInfo(input.transactionId);
  const decoded = decodeJwsPayload(response.signedTransactionInfo);
  const actualProductId = typeof decoded.productId === "string" ? decoded.productId : "";
  const actualTransactionId = typeof decoded.transactionId === "string" ? decoded.transactionId : "";
  const bundleId = process.env.APPLE_IAP_BUNDLE_ID!;

  if (actualTransactionId !== input.transactionId || actualProductId !== input.productId) {
    throw new MobileStoreVerificationError("Apple transaction does not match the requested license.");
  }
  if (decoded.bundleId !== bundleId) {
    throw new MobileStoreVerificationError("Apple transaction belongs to another app.");
  }
  if (decoded.revocationDate) {
    throw new MobileStoreVerificationError("This Apple purchase has been revoked.", 409);
  }

  return {
    platform: "apple",
    environment: input.environment,
    transactionId: actualTransactionId,
    productId: actualProductId,
    purchaseToken: response.signedTransactionInfo,
    raw: decoded,
  };
}

function googleAuth(): GoogleAuth {
  const serviceAccount = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!serviceAccount || !process.env.GOOGLE_PLAY_PACKAGE_NAME) {
    throw new MobileStoreVerificationError(
      "Google Play mobile purchases are not configured on the server.",
      503,
    );
  }
  try {
    return new GoogleAuth({
      credentials: JSON.parse(serviceAccount),
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
  } catch {
    throw new MobileStoreVerificationError("Google Play service account configuration is invalid.", 503);
  }
}

async function verifyGooglePurchase(
  input: MobileStoreVerificationInput,
): Promise<VerifiedMobileStoreTransaction> {
  if (!input.purchaseToken) {
    throw new MobileStoreVerificationError("Google Play purchase token is required.");
  }
  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME!;
  const client = await googleAuth().getClient();
  const url =
    "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/" +
    encodeURIComponent(packageName) +
    "/purchases/productsv2/tokens/" +
    encodeURIComponent(input.purchaseToken);
  const response = await client.request<unknown>({ url });
  const data = (response.data ?? {}) as Record<string, unknown>;
  const lineItems = Array.isArray(data.productLineItem) ? data.productLineItem : [];
  const matchingLineItem = lineItems.find((value) => {
    const item = value as Record<string, unknown>;
    return item.productId === input.productId;
  }) as Record<string, unknown> | undefined;

  if (!matchingLineItem) {
    throw new MobileStoreVerificationError("Google Play transaction does not match the requested license.");
  }
  if (data.purchaseStateContext && typeof data.purchaseStateContext === "object") {
    const state = (data.purchaseStateContext as Record<string, unknown>).purchaseState;
    if (state !== "PURCHASED") {
      throw new MobileStoreVerificationError("Google Play payment is not complete yet.", 409);
    }
  }

  return {
    platform: "google",
    environment: input.environment,
    transactionId: input.transactionId,
    productId: input.productId,
    purchaseToken: input.purchaseToken,
    raw: data,
  };
}

/**
 * Verify purchase ownership directly with the issuing storefront. This module
 * intentionally fails closed when a provider credential is absent or invalid.
 */
export async function verifyMobileStoreTransaction(
  input: MobileStoreVerificationInput,
): Promise<VerifiedMobileStoreTransaction> {
  const expectedTier = tierForMobileProduct(input.productId);
  if (!expectedTier) throw new MobileStoreVerificationError("Unknown mobile license product.");

  try {
    return input.platform === "apple"
      ? await verifyApplePurchase(input)
      : await verifyGooglePurchase(input);
  } catch (error) {
    if (error instanceof MobileStoreVerificationError) throw error;
    console.error("[mobile-purchase] store verification failed", {
      platform: input.platform,
      transactionId: input.transactionId,
    });
    throw new MobileStoreVerificationError("The store could not verify this purchase.");
  }
}
