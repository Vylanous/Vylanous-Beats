import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";
import { fetchMobileAppSettings } from "./api";

export const mobileTabIds = ["home", "beats", "cart", "library", "account"] as const;
export type MobileTabId = (typeof mobileTabIds)[number];
export const mobileHomeSectionIds = ["hero", "featured", "promise"] as const;
export type MobileHomeSectionId = (typeof mobileHomeSectionIds)[number];
export type MobileActionId = "beats" | "cart" | "library" | "account";

export type MobileAppSettings = {
  version: 1;
  enabled: boolean;
  visual: {
    chromeHeaders: boolean;
    contentDensity: "compact" | "standard" | "relaxed";
    bottomNavigationStyle: "floating" | "attached";
    bottomNavigationOffset: number;
  };
  navigation: { tabs: { id: MobileTabId; label: string; visible: boolean }[] };
  home: {
    showBrandHeader: boolean;
    sectionOrder: MobileHomeSectionId[];
    heroEyebrow: string;
    heroTitle: string;
    heroBody: string;
    primaryCtaLabel: string;
    primaryCtaAction: MobileActionId;
    featuredEyebrow: string;
    featuredTitle: string;
    showFeatured: boolean;
    promiseTitle: string;
    promiseBody: string;
    showPromise: boolean;
  };
  features: { customerAccount: boolean; customerLibrary: boolean; nativeCheckout: boolean };
};

export const DEFAULT_MOBILE_APP_SETTINGS: MobileAppSettings = {
  version: 1,
  enabled: true,
  visual: {
    chromeHeaders: true,
    contentDensity: "standard",
    bottomNavigationStyle: "floating",
    bottomNavigationOffset: 14,
  },
  navigation: {
    tabs: [
      { id: "home", label: "Home", visible: true },
      { id: "beats", label: "Beats", visible: true },
      { id: "cart", label: "Cart", visible: true },
      { id: "library", label: "Library", visible: true },
      { id: "account", label: "Account", visible: true },
    ],
  },
  home: {
    showBrandHeader: true,
    sectionOrder: ["hero", "featured", "promise"],
    heroEyebrow: "Premium Hip-Hop Beats",
    heroTitle: "Beats That\nHit Different.",
    heroBody:
      "Rhythmic expression, melodious compositions, and street-ready energy for artists who want to stand out.",
    primaryCtaLabel: "Browse Beats",
    primaryCtaAction: "beats",
    featuredEyebrow: "Hand-picked",
    featuredTitle: "Featured Beats",
    showFeatured: true,
    promiseTitle: "Studio Quality. Instant Delivery.",
    promiseBody:
      "Preview every beat, choose the license that fits your release, and receive your files by email after confirmation.",
    showPromise: true,
  },
  features: { customerAccount: true, customerLibrary: true, nativeCheckout: true },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown, fallback: string, max: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeSettings(value: unknown): MobileAppSettings {
  if (!isRecord(value)) return DEFAULT_MOBILE_APP_SETTINGS;
  const visual = isRecord(value.visual) ? value.visual : {};
  const navigation = isRecord(value.navigation) ? value.navigation : {};
  const home = isRecord(value.home) ? value.home : {};
  const features = isRecord(value.features) ? value.features : {};
  const rawTabs = Array.isArray(navigation.tabs) ? navigation.tabs : [];
  const rawOrder = Array.isArray(home.sectionOrder) ? home.sectionOrder : [];
  const tabs: MobileAppSettings["navigation"]["tabs"] = [];
  const seenTabIds = new Set<MobileTabId>();
  for (const candidate of rawTabs) {
    if (!isRecord(candidate) || typeof candidate.id !== "string") continue;
    if (!(mobileTabIds as readonly string[]).includes(candidate.id)) continue;
    const id = candidate.id as MobileTabId;
    if (seenTabIds.has(id)) continue;
    const fallback = DEFAULT_MOBILE_APP_SETTINGS.navigation.tabs.find((tab) => tab.id === id)!;
    tabs.push({
      id,
      label: stringValue(candidate.label, fallback.label, 18),
      visible: booleanValue(candidate.visible, fallback.visible),
    });
    seenTabIds.add(id);
  }
  for (const fallback of DEFAULT_MOBILE_APP_SETTINGS.navigation.tabs) {
    if (!seenTabIds.has(fallback.id)) tabs.push({ ...fallback });
  }
  if (!tabs.some((tab) => tab.visible && (tab.id === "home" || tab.id === "beats"))) {
    const home = tabs.find((tab) => tab.id === "home");
    if (home) home.visible = true;
  }
  const order = rawOrder.filter(
    (id): id is MobileHomeSectionId =>
      typeof id === "string" && (mobileHomeSectionIds as readonly string[]).includes(id),
  );
  const visualStyle = visual.bottomNavigationStyle;
  const density = visual.contentDensity;
  const action = home.primaryCtaAction;

  return {
    version: 1,
    enabled: booleanValue(value.enabled, true),
    visual: {
      chromeHeaders: booleanValue(visual.chromeHeaders, true),
      contentDensity:
        density === "compact" || density === "relaxed" || density === "standard" ? density : "standard",
      bottomNavigationStyle: visualStyle === "attached" ? "attached" : "floating",
      bottomNavigationOffset:
        typeof visual.bottomNavigationOffset === "number"
          ? Math.min(48, Math.max(0, Math.round(visual.bottomNavigationOffset)))
          : DEFAULT_MOBILE_APP_SETTINGS.visual.bottomNavigationOffset,
    },
    navigation: { tabs },
    home: {
      showBrandHeader: booleanValue(home.showBrandHeader, true),
      sectionOrder:
        order.length > 0
          ? [...order, ...mobileHomeSectionIds.filter((id) => !order.includes(id))]
          : [...DEFAULT_MOBILE_APP_SETTINGS.home.sectionOrder],
      heroEyebrow: stringValue(home.heroEyebrow, DEFAULT_MOBILE_APP_SETTINGS.home.heroEyebrow, 60),
      heroTitle: stringValue(home.heroTitle, DEFAULT_MOBILE_APP_SETTINGS.home.heroTitle, 100),
      heroBody: stringValue(home.heroBody, DEFAULT_MOBILE_APP_SETTINGS.home.heroBody, 320),
      primaryCtaLabel: stringValue(
        home.primaryCtaLabel,
        DEFAULT_MOBILE_APP_SETTINGS.home.primaryCtaLabel,
        30,
      ),
      primaryCtaAction:
        action === "cart" || action === "library" || action === "account" || action === "beats"
          ? action
          : "beats",
      featuredEyebrow: stringValue(
        home.featuredEyebrow,
        DEFAULT_MOBILE_APP_SETTINGS.home.featuredEyebrow,
        60,
      ),
      featuredTitle: stringValue(home.featuredTitle, DEFAULT_MOBILE_APP_SETTINGS.home.featuredTitle, 80),
      showFeatured: booleanValue(home.showFeatured, true),
      promiseTitle: stringValue(home.promiseTitle, DEFAULT_MOBILE_APP_SETTINGS.home.promiseTitle, 100),
      promiseBody: stringValue(home.promiseBody, DEFAULT_MOBILE_APP_SETTINGS.home.promiseBody, 320),
      showPromise: booleanValue(home.showPromise, true),
    },
    features: {
      customerAccount: booleanValue(features.customerAccount, true),
      customerLibrary: booleanValue(features.customerLibrary, true),
      nativeCheckout: booleanValue(features.nativeCheckout, true),
    },
  };
}

const MobileAppSettingsContext = createContext<MobileAppSettings>(DEFAULT_MOBILE_APP_SETTINGS);

export function MobileAppSettingsProvider({ children }: { children: ReactNode }) {
  const settings = useQuery({
    queryKey: ["mobile-app-settings"],
    queryFn: fetchMobileAppSettings,
    staleTime: 60_000,
  });
  const normalized = normalizeSettings(settings.data);
  const value = normalized.enabled ? normalized : DEFAULT_MOBILE_APP_SETTINGS;

  return <MobileAppSettingsContext.Provider value={value}>{children}</MobileAppSettingsContext.Provider>;
}

export function useMobileAppSettings() {
  return useContext(MobileAppSettingsContext);
}

export function mobileDensityPadding(density: MobileAppSettings["visual"]["contentDensity"]) {
  return density === "compact" ? 18 : density === "relaxed" ? 26 : 22;
}
