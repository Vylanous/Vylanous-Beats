import { useEffect, useState } from "react";
import { Loader2, Check, RotateCcw, Save } from "lucide-react";
import { getAdminSettings, saveAdminSettings, resetAdminSettings } from "../../lib/admin";
import { FileUpload } from "./file-upload";
import {
  DEFAULT_SETTINGS,
  DEFAULT_BRAND,
  FONT_PAIRS,
  getFontPair,
  type SiteSettings,
  type ThemeColors,
} from "../../../shared/site-settings";

const COLOR_FIELDS: { key: keyof ThemeColors; label: string; hint: string }[] = [
  { key: "primary", label: "Brand / Primary", hint: "Buttons, links, prices" },
  { key: "primaryBright", label: "Primary Glow", hint: "Hover states, highlights" },
  { key: "primaryDeep", label: "Primary Deep", hint: "Gradients, shadows" },
  { key: "background", label: "Background", hint: "Page base" },
  { key: "surface", label: "Surface", hint: "Cards, panels" },
  { key: "surfaceHover", label: "Surface Hover", hint: "Borders, hover fills" },
  { key: "text", label: "Text", hint: "Headings & body text" },
  { key: "muted", label: "Muted Text", hint: "Secondary text" },
];

export default function CustomizationPanel() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [preview, setPreview] = useState<SiteSettings["brand"]>(DEFAULT_BRAND);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    getAdminSettings()
      .then((r) => {
        setSettings(r.settings);
        setPreview(r.preview.brand);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const setColor = (key: keyof ThemeColors, value: string) =>
    setSettings((s) => ({ ...s, theme: { ...s.theme, [key]: value } }));

  const save = async () => {
    setSaving(true);
    setErr("");
    setSaved(false);
    try {
      await saveAdminSettings(settings);
      const fresh = await getAdminSettings();
      setSettings(fresh.settings);
      setPreview(fresh.preview.brand);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (
      !confirm("Reset colors, fonts, and logos back to the original Vylanous Beats brand defaults?")
    )
      return;
    setResetting(true);
    setErr("");
    try {
      await resetAdminSettings();
      const fresh = await getAdminSettings();
      setSettings(fresh.settings);
      setPreview(fresh.preview.brand);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="animate-spin text-vb-purple-bright" size={24} />
      </div>
    );
  }

  const activeFont = getFontPair(settings.fontId);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-wide text-chrome">
            Site Customization
          </h2>
          <p className="font-body text-sm text-vb-silver/50 mt-1">
            Re-skin the live site — colors, typography, and brand images. Changes apply instantly
            for visitors once saved.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            disabled={resetting || saving}
            className="flex items-center gap-1.5 font-sub uppercase tracking-wider text-sm px-4 py-2.5 rounded-lg border border-white/10 text-vb-silver hover:border-red-400/50 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            {resetting ? <Loader2 className="animate-spin" size={15} /> : <RotateCcw size={15} />}
            Reset
          </button>
          <button
            onClick={save}
            disabled={saving || resetting}
            className="flex items-center gap-1.5 font-sub uppercase tracking-wider text-sm px-5 py-2.5 rounded-lg bg-vb-purple text-white hover:bg-vb-purple-bright transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={15} />
            ) : saved ? (
              <Check size={15} />
            ) : (
              <Save size={15} />
            )}
            {saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </div>

      {err && <p className="text-red-400 font-body text-sm mb-4">{err}</p>}

      {/* Live preview strip */}
      <div
        className="rounded-xl border border-white/10 p-6 mb-8 overflow-hidden relative"
        style={{ background: settings.theme.background }}
      >
        <link rel="stylesheet" href={activeFont.googleFontsUrl} />
        <p
          className="uppercase text-3xl tracking-wide mb-1"
          style={{ fontFamily: activeFont.display, color: settings.theme.text }}
        >
          Vylanous Beats
        </p>
        <p
          className="uppercase text-sm tracking-widest mb-3"
          style={{ fontFamily: activeFont.sub, color: settings.theme.primaryBright }}
        >
          Beats that hit different
        </p>
        <p
          className="text-sm max-w-md"
          style={{ fontFamily: activeFont.body, color: settings.theme.muted }}
        >
          This is a live preview of your chosen palette and typography pairing.
        </p>
        <button
          className="mt-4 px-5 py-2 rounded-lg text-sm uppercase tracking-wider"
          style={{ background: settings.theme.primary, color: "#fff", fontFamily: activeFont.sub }}
        >
          Add to cart
        </button>
      </div>

      {/* Color palette */}
      <section className="mb-8">
        <h3 className="font-sub uppercase tracking-widest text-vb-silver text-lg mb-4">
          Color Palette
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {COLOR_FIELDS.map(({ key, label, hint }) => (
            <div
              key={key}
              className="flex items-center gap-3 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3"
            >
              <input
                type="color"
                aria-label={`${label} color picker`}
                value={settings.theme[key]}
                onChange={(e) => setColor(key, e.target.value)}
                className="h-10 w-10 rounded-lg border border-white/10 bg-transparent cursor-pointer shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-body text-sm text-vb-silver-bright">{label}</div>
                <div className="font-body text-xs text-vb-silver/40">{hint}</div>
              </div>
              <input
                type="text"
                aria-label={`${label} hex value`}
                value={settings.theme[key]}
                onChange={(e) => setColor(key, e.target.value)}
                className="w-24 bg-transparent text-right font-body text-xs text-vb-silver/60 outline-none"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="mb-8">
        <h3 className="font-sub uppercase tracking-widest text-vb-silver text-lg mb-4">
          Typography
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {FONT_PAIRS.map((pair) => (
            <button
              key={pair.id}
              onClick={() => setSettings((s) => ({ ...s, fontId: pair.id }))}
              className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                settings.fontId === pair.id
                  ? "border-vb-purple-bright bg-vb-purple/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <div className="font-body text-sm text-vb-silver-bright">{pair.label}</div>
              <div className="font-body text-xs text-vb-silver/40 mt-0.5">
                {pair.display.split(",")[0].replace(/'/g, "")} ·{" "}
                {pair.body.split(",")[0].replace(/'/g, "")}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Brand assets */}
      <section className="mb-4">
        <h3 className="font-sub uppercase tracking-widest text-vb-silver text-lg mb-4">
          Brand Images
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <FileUpload
            label="Nav / square logo mark"
            hint="Square icon shown in the header"
            accept="image/*"
            folder="brand"
            kind="image"
            value={settings.brand.squareLogoUrl}
            previewUrl={preview.squareLogoUrl}
            onChange={(key) =>
              setSettings((s) => ({ ...s, brand: { ...s.brand, squareLogoUrl: key } }))
            }
          />
          <FileUpload
            label="Full wordmark logo"
            hint="Wide logo shown in the footer"
            accept="image/*"
            folder="brand"
            kind="image"
            value={settings.brand.fullLogoUrl}
            previewUrl={preview.fullLogoUrl}
            onChange={(key) =>
              setSettings((s) => ({ ...s, brand: { ...s.brand, fullLogoUrl: key } }))
            }
          />
          <FileUpload
            label="Favicon"
            hint="Browser tab icon"
            accept="image/png,image/x-icon"
            folder="brand"
            kind="image"
            value={settings.brand.faviconUrl}
            previewUrl={preview.faviconUrl}
            onChange={(key) =>
              setSettings((s) => ({ ...s, brand: { ...s.brand, faviconUrl: key } }))
            }
          />
        </div>
      </section>
    </div>
  );
}
