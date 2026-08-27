import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Loader2, RotateCcw, Save, Smartphone } from "lucide-react";
import { getAdminSettings, saveAdminSettings } from "../../lib/admin";
import {
  DEFAULT_MOBILE_APP,
  type MobileAppSettings,
  type MobileHomeSectionId,
  type MobileTabId,
} from "../../../shared/site-settings";

const TAB_NAMES: Record<MobileTabId, string> = {
  home: "Home",
  beats: "Beats",
  cart: "Cart",
  library: "Library",
  account: "Account",
};

const SECTION_NAMES: Record<MobileHomeSectionId, string> = {
  hero: "Hero / first impression",
  featured: "Featured beats rail",
  promise: "Delivery promise card",
};

function move<T>(items: T[], index: number, direction: -1 | 1) {
  const next = [...items];
  const destination = index + direction;
  if (destination < 0 || destination >= next.length) return next;
  [next[index], next[destination]] = [next[destination]!, next[index]!];
  return next;
}

export default function MobileAppStudioPanel() {
  const [settings, setSettings] = useState<MobileAppSettings>(DEFAULT_MOBILE_APP);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminSettings()
      .then((result) => setSettings(result.settings.mobileApp || DEFAULT_MOBILE_APP))
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Failed to load app settings"),
      )
      .finally(() => setLoading(false));
  }, []);

  const visibleTabs = useMemo(
    () => settings.navigation.tabs.filter((tab) => tab.visible).length,
    [settings.navigation.tabs],
  );

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const result = await saveAdminSettings({ mobileApp: settings });
      setSettings(result.settings.mobileApp);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to save app settings");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    if (!confirm("Restore the native app configuration to the Vylanous Beats defaults?")) return;
    setSettings(DEFAULT_MOBILE_APP);
    setSaved(false);
    setError("");
  };

  const updateTab = (
    id: MobileTabId,
    patch: Partial<MobileAppSettings["navigation"]["tabs"][number]>,
  ) => {
    setSettings((current) => {
      const tabs = current.navigation.tabs.map((tab) =>
        tab.id === id ? { ...tab, ...patch } : tab,
      );
      if (!tabs.some((tab) => tab.visible && (tab.id === "home" || tab.id === "beats"))) {
        const home = tabs.find((tab) => tab.id === "home");
        if (home) home.visible = true;
      }
      return { ...current, navigation: { tabs } };
    });
  };

  const updateHome = (patch: Partial<MobileAppSettings["home"]>) => {
    setSettings((current) => ({ ...current, home: { ...current.home, ...patch } }));
  };

  const updateEnabled = (enabled: boolean) => {
    setSettings((current) => ({ ...current, enabled }));
  };

  const updateVisual = (patch: Partial<MobileAppSettings["visual"]>) => {
    setSettings((current) => ({ ...current, visual: { ...current.visual, ...patch } }));
  };

  const updateFeature = (key: keyof MobileAppSettings["features"], value: boolean) => {
    setSettings((current) => ({
      ...current,
      features: { ...current.features, [key]: value },
      navigation:
        key === "nativeCheckout" && value
          ? {
              tabs: current.navigation.tabs.map((tab) =>
                tab.id === "cart" ? { ...tab, visible: true } : tab,
              ),
            }
          : current.navigation,
    }));
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="animate-spin text-vb-purple-bright" size={24} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl pb-12">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7">
        <div className="flex gap-3">
          <div className="h-11 w-11 rounded-xl bg-vb-purple/15 border border-vb-purple/30 grid place-items-center text-vb-purple-bright shrink-0">
            <Smartphone size={21} />
          </div>
          <div>
            <h2 className="font-display text-2xl uppercase tracking-wide text-chrome">
              Mobile App Studio
            </h2>
            <p className="font-body text-sm text-vb-silver/60 mt-1 max-w-2xl">
              Configure the approved native UI, bottom menu, Home modules, and built-in customer
              features. Settings are served live to compatible Android and iPhone builds.
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={reset}
            disabled={saving}
            className="flex items-center gap-1.5 font-sub uppercase tracking-wider text-sm px-4 py-2.5 rounded-lg border border-white/10 text-vb-silver hover:border-red-400/50 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            <RotateCcw size={15} /> Reset draft
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 font-sub uppercase tracking-wider text-sm px-5 py-2.5 rounded-lg bg-vb-purple text-white hover:bg-vb-purple-bright transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={15} />
            ) : saved ? (
              <Check size={15} />
            ) : (
              <Save size={15} />
            )}
            {saved ? "Saved" : "Publish app settings"}
          </button>
        </div>
      </div>

      {error && <p className="font-body text-sm text-red-400 mb-5">{error}</p>}

      <div className="rounded-xl border border-vb-purple/30 bg-vb-purple/[0.07] px-4 py-3 mb-8 font-body text-sm text-vb-silver/80">
        <strong className="text-vb-silver-bright">Safe by design:</strong> this studio controls
        approved native components and routes. New custom code, permissions, payment providers, or
        entirely new screens still require an app update and a new binary.
      </div>

      <section className="mb-8">
        <h3 className="font-sub uppercase tracking-widest text-vb-silver text-lg mb-4">
          Visual system
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <ToggleCard
            label="Use live Mobile App Studio configuration"
            hint="Turn this off to have compatible native builds use the baseline Vylanous defaults."
            checked={settings.enabled}
            onChange={updateEnabled}
          />
          <ToggleCard
            label="Silver gradient display headers"
            hint="Uses the website's chrome treatment for block-style Anton headings."
            checked={settings.visual.chromeHeaders}
            onChange={(value) => updateVisual({ chromeHeaders: value })}
          />
          <label className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <span className="font-body text-sm text-vb-silver-bright block">Content density</span>
            <span className="font-body text-xs text-vb-silver/40 block mt-0.5">
              Horizontal screen spacing
            </span>
            <select
              value={settings.visual.contentDensity}
              onChange={(event) =>
                updateVisual({
                  contentDensity: event.target
                    .value as MobileAppSettings["visual"]["contentDensity"],
                })
              }
              className="mt-3 w-full bg-vb-black border border-white/10 rounded-lg px-3 py-2 font-body text-sm text-vb-silver-bright outline-none"
            >
              <option value="compact">Compact</option>
              <option value="standard">Standard</option>
              <option value="relaxed">Relaxed</option>
            </select>
          </label>
          <label className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <span className="font-body text-sm text-vb-silver-bright block">
              Bottom navigation style
            </span>
            <span className="font-body text-xs text-vb-silver/40 block mt-0.5">
              Floating clears device controls
            </span>
            <select
              value={settings.visual.bottomNavigationStyle}
              onChange={(event) =>
                updateVisual({
                  bottomNavigationStyle: event.target
                    .value as MobileAppSettings["visual"]["bottomNavigationStyle"],
                })
              }
              className="mt-3 w-full bg-vb-black border border-white/10 rounded-lg px-3 py-2 font-body text-sm text-vb-silver-bright outline-none"
            >
              <option value="floating">Floating above system navigation</option>
              <option value="attached">Attached to bottom edge</option>
            </select>
          </label>
          <label className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <span className="font-body text-sm text-vb-silver-bright block">
              Extra bottom clearance
            </span>
            <span className="font-body text-xs text-vb-silver/40 block mt-0.5">
              0–48 px above the device navigation area
            </span>
            <input
              type="range"
              aria-label="Extra bottom clearance"
              min="0"
              max="48"
              value={settings.visual.bottomNavigationOffset}
              onChange={(event) =>
                updateVisual({ bottomNavigationOffset: Number(event.target.value) })
              }
              className="mt-4 w-full accent-vb-purple"
            />
            <div className="font-sub text-vb-purple-bright text-base mt-1">
              {settings.visual.bottomNavigationOffset}px
            </div>
          </label>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <div>
            <h3 className="font-sub uppercase tracking-widest text-vb-silver text-lg">
              Bottom menu
            </h3>
            <p className="font-body text-xs text-vb-silver/40 mt-1">
              {visibleTabs} of 5 approved tabs visible. Home or Beats always remains available.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {settings.navigation.tabs.map((tab, index) => (
            <div
              key={tab.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex flex-wrap sm:flex-nowrap items-center gap-3"
            >
              <label className="flex items-center gap-2 shrink-0">
                <input
                  type="checkbox"
                  aria-label={`Show ${TAB_NAMES[tab.id]} in the bottom menu`}
                  checked={tab.visible}
                  onChange={(event) => updateTab(tab.id, { visible: event.target.checked })}
                  className="accent-vb-purple h-4 w-4"
                />
                <span className="font-body text-sm text-vb-silver-bright">{TAB_NAMES[tab.id]}</span>
              </label>
              <input
                value={tab.label}
                maxLength={18}
                onChange={(event) => updateTab(tab.id, { label: event.target.value })}
                className="min-w-[8rem] flex-1 bg-vb-black border border-white/10 rounded-lg px-3 py-2 font-body text-sm text-vb-silver-bright outline-none focus:border-vb-purple-bright/60"
                aria-label={`${TAB_NAMES[tab.id]} menu label`}
              />
              <div className="flex gap-1 shrink-0">
                <button
                  aria-label={`Move ${tab.label} earlier`}
                  disabled={index === 0}
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      navigation: { tabs: move(current.navigation.tabs, index, -1) },
                    }))
                  }
                  className="p-2 rounded-lg border border-white/10 text-vb-silver hover:text-vb-silver-bright disabled:opacity-30"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  aria-label={`Move ${tab.label} later`}
                  disabled={index === settings.navigation.tabs.length - 1}
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      navigation: { tabs: move(current.navigation.tabs, index, 1) },
                    }))
                  }
                  className="p-2 rounded-lg border border-white/10 text-vb-silver hover:text-vb-silver-bright disabled:opacity-30"
                >
                  <ArrowDown size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="font-sub uppercase tracking-widest text-vb-silver text-lg mb-4">
          Home layout and calls to action
        </h3>
        <div className="space-y-2 mb-4">
          {settings.home.sectionOrder.map((section, index) => (
            <div
              key={section}
              className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 flex items-center justify-between gap-3"
            >
              <span className="font-body text-sm text-vb-silver-bright">
                {SECTION_NAMES[section]}
              </span>
              <div className="flex gap-1">
                <button
                  aria-label={`Move ${SECTION_NAMES[section]} earlier`}
                  disabled={index === 0}
                  onClick={() =>
                    updateHome({ sectionOrder: move(settings.home.sectionOrder, index, -1) })
                  }
                  className="p-2 rounded-lg border border-white/10 text-vb-silver hover:text-vb-silver-bright disabled:opacity-30"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  aria-label={`Move ${SECTION_NAMES[section]} later`}
                  disabled={index === settings.home.sectionOrder.length - 1}
                  onClick={() =>
                    updateHome({ sectionOrder: move(settings.home.sectionOrder, index, 1) })
                  }
                  className="p-2 rounded-lg border border-white/10 text-vb-silver hover:text-vb-silver-bright disabled:opacity-30"
                >
                  <ArrowDown size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <ToggleCard
            label="Show brand header"
            hint="Logo and Vylanous wordmark at the top of Home."
            checked={settings.home.showBrandHeader}
            onChange={(value) => updateHome({ showBrandHeader: value })}
          />
          <ToggleCard
            label="Show featured beats"
            hint="Horizontal rail driven by the live featured catalog."
            checked={settings.home.showFeatured}
            onChange={(value) => updateHome({ showFeatured: value })}
          />
          <ToggleCard
            label="Show delivery promise"
            hint="The Studio Quality / Instant Delivery information card."
            checked={settings.home.showPromise}
            onChange={(value) => updateHome({ showPromise: value })}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <Field
            label="Hero eyebrow"
            value={settings.home.heroEyebrow}
            onChange={(value) => updateHome({ heroEyebrow: value })}
          />
          <Field
            label="Hero title"
            value={settings.home.heroTitle}
            onChange={(value) => updateHome({ heroTitle: value })}
          />
          <Field
            label="Hero body"
            value={settings.home.heroBody}
            textarea
            onChange={(value) => updateHome({ heroBody: value })}
          />
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <span className="font-body text-sm text-vb-silver-bright block">Primary button</span>
            <input
              aria-label="Primary button label"
              value={settings.home.primaryCtaLabel}
              maxLength={30}
              onChange={(event) => updateHome({ primaryCtaLabel: event.target.value })}
              className="mt-3 w-full bg-vb-black border border-white/10 rounded-lg px-3 py-2 font-body text-sm text-vb-silver-bright outline-none focus:border-vb-purple-bright/60"
            />
            <select
              aria-label="Primary button action"
              value={settings.home.primaryCtaAction}
              onChange={(event) =>
                updateHome({
                  primaryCtaAction: event.target
                    .value as MobileAppSettings["home"]["primaryCtaAction"],
                })
              }
              className="mt-2 w-full bg-vb-black border border-white/10 rounded-lg px-3 py-2 font-body text-sm text-vb-silver-bright outline-none"
            >
              <option value="beats">Open Beats</option>
              <option value="cart">Open Cart</option>
              <option value="library">Open Library</option>
              <option value="account">Open Account</option>
            </select>
          </div>
          <Field
            label="Featured eyebrow"
            value={settings.home.featuredEyebrow}
            onChange={(value) => updateHome({ featuredEyebrow: value })}
          />
          <Field
            label="Featured title"
            value={settings.home.featuredTitle}
            onChange={(value) => updateHome({ featuredTitle: value })}
          />
          <Field
            label="Promise title"
            value={settings.home.promiseTitle}
            onChange={(value) => updateHome({ promiseTitle: value })}
          />
          <Field
            label="Promise body"
            value={settings.home.promiseBody}
            textarea
            onChange={(value) => updateHome({ promiseBody: value })}
          />
        </div>
      </section>

      <section>
        <h3 className="font-sub uppercase tracking-widest text-vb-silver text-lg mb-4">
          Built-in functions
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <ToggleCard
            label="Customer account"
            hint="Show Account controls and customer sign-in routes."
            checked={settings.features.customerAccount}
            onChange={(value) => updateFeature("customerAccount", value)}
          />
          <ToggleCard
            label="Customer library"
            hint="Show purchase history and protected downloads."
            checked={settings.features.customerLibrary}
            onChange={(value) => updateFeature("customerLibrary", value)}
          />
          <ToggleCard
            label="Native checkout"
            hint="Enable the existing Apple / Google native purchase flow."
            checked={settings.features.nativeCheckout}
            onChange={(value) => updateFeature("nativeCheckout", value)}
          />
        </div>
      </section>
    </div>
  );
}

function ToggleCard({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 flex items-start gap-3">
      <input
        aria-label={label}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-vb-purple h-4 w-4 mt-0.5"
      />
      <span>
        <span className="font-body text-sm text-vb-silver-bright block">{label}</span>
        <span className="font-body text-xs text-vb-silver/40 block mt-0.5">{hint}</span>
      </span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 block">
      <span className="font-body text-sm text-vb-silver-bright block">{label}</span>
      {textarea ? (
        <textarea
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="mt-3 w-full resize-y bg-vb-black border border-white/10 rounded-lg px-3 py-2 font-body text-sm text-vb-silver-bright outline-none focus:border-vb-purple-bright/60"
        />
      ) : (
        <input
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-3 w-full bg-vb-black border border-white/10 rounded-lg px-3 py-2 font-body text-sm text-vb-silver-bright outline-none focus:border-vb-purple-bright/60"
        />
      )}
    </div>
  );
}
