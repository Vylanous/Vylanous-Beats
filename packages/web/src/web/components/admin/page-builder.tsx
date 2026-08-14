/**
 * Vylanous Site Builder: dark industrial surfaces, chrome display type, and a
 * purple accent. Controls stay dense and purposeful while enabling full-site design.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { getAdminSettings, saveAdminSettings } from "../../lib/admin";
import { FileUpload } from "./file-upload";
import type {
  BuilderPage,
  PageSection,
  PageSectionType,
  SectionItem,
  SectionLayout,
  SiteSettings,
  SocialLink,
  SocialPlatform,
} from "../../../shared/site-settings";

const SECTION_TYPES: { type: PageSectionType; label: string }[] = [
  { type: "hero", label: "Hero" },
  { type: "text", label: "Headline & text" },
  { type: "image", label: "Image" },
  { type: "video", label: "Video" },
  { type: "gallery", label: "Image gallery" },
  { type: "featureCards", label: "Feature cards" },
  { type: "callout", label: "Callout" },
  { type: "marquee", label: "Marquee" },
  { type: "divider", label: "Divider" },
  { type: "spacer", label: "Spacer" },
  { type: "pressKit", label: "Press kit" },
  { type: "merch", label: "Fourthwall merch" },
  { type: "featuredBeats", label: "Featured beats" },
  { type: "beatCatalog", label: "Beat catalog" },
  { type: "licenseTiers", label: "License tiers" },
  { type: "licenseComparison", label: "License comparison" },
];

const DEFAULT_LAYOUT: Required<SectionLayout> = {
  width: "wide",
  spacing: "normal",
  alignment: "left",
  surface: "transparent",
  columns: 3,
  mediaPosition: "none",
  mediaFit: "cover",
  mediaAspect: "auto",
  imageOverlay: "none",
  borderRadius: "rounded",
  emphasis: "standard",
};

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function blankSection(type: PageSectionType): PageSection {
  const section: PageSection = {
    id: newId("section"),
    type,
    title: type === "merch" ? "Latest Drop" : "New section",
    body: "",
    layout: { ...DEFAULT_LAYOUT },
  };
  if (type === "merch") section.collection = "all";
  if (type === "featureCards" || type === "gallery") section.items = [];
  if (type === "marquee") section.title = "MAKE SOME NOISE";
  if (type === "spacer" || type === "divider") section.title = "";
  if (type === "video") section.title = "New video";
  return section;
}

function blankPage(): BuilderPage {
  const slug = "new-page";
  return {
    id: newId("page"),
    slug,
    path: `/${slug}`,
    title: "New Page",
    navLabel: "New Page",
    published: false,
    showInNav: false,
    showInFooter: false,
    navOrder: 1000,
    layout: { showHeader: true, showFooter: true, background: "default" },
    seo: { canonicalPath: `/${slug}` },
    sections: [blankSection("hero")],
  };
}

function sortedPages(pages: BuilderPage[]) {
  return [...pages].sort((a, b) => (a.navOrder ?? 1000) - (b.navOrder ?? 1000));
}

export default function PageBuilderPanel() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [previews, setPreviews] = useState<SiteSettings | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getAdminSettings()
      .then(({ settings: loaded, preview }) => {
        setSettings(loaded);
        setPreviews(preview);
        setSelectedId(loaded.pages[0]?.id || "");
      })
      .catch(() => setNotice("Unable to load site-builder settings."));
  }, []);

  const page = useMemo(
    () => settings?.pages.find((candidate) => candidate.id === selectedId) || settings?.pages[0],
    [selectedId, settings],
  );

  const updateSettings = (patch: Partial<SiteSettings>) =>
    setSettings((current) => (current ? { ...current, ...patch } : current));

  const updatePage = (next: BuilderPage) => {
    if (!settings) return;
    updateSettings({
      pages: settings.pages.map((candidate) => (candidate.id === next.id ? next : candidate)),
    });
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setNotice("");
    try {
      await saveAdminSettings({
        pages: settings.pages,
        fourthwall: settings.fourthwall,
        header: settings.header,
        footer: settings.footer,
        socials: settings.socials,
      });
      const refreshed = await getAdminSettings();
      setSettings(refreshed.settings);
      setPreviews(refreshed.preview);
      setNotice("Saved. Your live design, navigation, and global chrome update immediately.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save site-builder changes.");
    } finally {
      setSaving(false);
    }
  };

  const moveNavigation = (id: string, direction: -1 | 1) => {
    if (!settings) return;
    const visible = sortedPages(settings.pages.filter((candidate) => candidate.showInNav));
    const index = visible.findIndex((candidate) => candidate.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= visible.length) return;
    [visible[index], visible[nextIndex]] = [visible[nextIndex], visible[index]];
    const order = new Map(
      visible.map((candidate, position) => [candidate.id, (position + 1) * 10]),
    );
    updateSettings({
      pages: settings.pages.map((candidate) =>
        order.has(candidate.id) ? { ...candidate, navOrder: order.get(candidate.id) } : candidate,
      ),
    });
  };

  if (!settings || !page) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="animate-spin text-vb-purple-bright" />
      </div>
    );
  }

  const updateSection = (id: string, patch: Partial<PageSection>) =>
    updatePage({
      ...page,
      sections: page.sections.map((section) =>
        section.id === id ? { ...section, ...patch } : section,
      ),
    });
  const moveSection = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= page.sections.length) return;
    const sections = [...page.sections];
    [sections[index], sections[destination]] = [sections[destination], sections[index]];
    updatePage({ ...page, sections });
  };
  const previewPage = previews?.pages.find((candidate) => candidate.id === page.id);

  return (
    <div className="pb-12">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wide text-chrome">
            Site Builder
          </h1>
          <p className="mt-1 max-w-2xl font-body text-sm text-vb-silver/55">
            Manage every public page, navigation order, global chrome, media, and advanced layouts
            from one place.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-vb-purple px-4 py-2.5 font-sub uppercase tracking-wide text-white transition hover:bg-vb-purple-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? "Saving" : "Save site design"}
        </button>
      </div>
      {notice && <p className="mb-4 font-body text-sm text-vb-purple-bright">{notice}</p>}

      <GlobalChromeEditor settings={settings} onChange={updateSettings} />

      <section className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <div className="mb-4">
          <h2 className="font-sub text-xl uppercase tracking-wide">Live navigation order</h2>
          <p className="font-body text-sm text-vb-silver/50">
            Only pages marked “Show in header navigation” appear here. Use the arrows to set the
            live order.
          </p>
        </div>
        <div className="space-y-2">
          {sortedPages(settings.pages.filter((candidate) => candidate.showInNav)).map(
            (candidate) => (
              <div
                key={candidate.id}
                className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-vb-black/40 px-3 py-2.5"
              >
                <GripVertical size={17} className="text-vb-silver/35" />
                <button
                  onClick={() => setSelectedId(candidate.id)}
                  className="min-w-0 flex-1 text-left font-body text-sm text-vb-silver-bright hover:text-vb-purple-bright"
                >
                  <span className="block truncate">{candidate.navLabel}</span>
                  <span className="block text-xs text-vb-silver/40">
                    {candidate.path || `/${candidate.slug}`}
                  </span>
                </button>
                <button
                  aria-label={`Move ${candidate.navLabel} up`}
                  onClick={() => moveNavigation(candidate.id, -1)}
                  className="rounded p-1.5 text-vb-silver/60 hover:bg-white/[0.06] hover:text-white"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  aria-label={`Move ${candidate.navLabel} down`}
                  onClick={() => moveNavigation(candidate.id, 1)}
                  className="rounded p-1.5 text-vb-silver/60 hover:bg-white/[0.06] hover:text-white"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            ),
          )}
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
          <div className="mb-2 px-2 font-sub text-xs uppercase tracking-[0.2em] text-vb-silver/45">
            Pages
          </div>
          <div className="space-y-1">
            {sortedPages(settings.pages).map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => setSelectedId(candidate.id)}
                className={`w-full rounded-lg px-3 py-2.5 text-left font-body text-sm transition ${page.id === candidate.id ? "bg-vb-purple/20 text-vb-silver-bright" : "text-vb-silver/65 hover:bg-white/[0.05]"}`}
              >
                <span className="block truncate">{candidate.title}</span>
                <span className="block text-xs opacity-55">
                  {candidate.path || `/${candidate.slug}`}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              const next = blankPage();
              updateSettings({ pages: [...settings.pages, next] });
              setSelectedId(next.id);
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 px-3 py-2.5 font-sub text-sm uppercase tracking-wide text-vb-silver/70 transition hover:border-vb-purple/60 hover:text-vb-silver-bright"
          >
            <Plus size={15} /> Add custom page
          </button>
        </aside>

        <div className="space-y-5">
          <PagePropertiesEditor page={page} onChange={updatePage} />
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-sub text-xl uppercase tracking-wide">Page sections</h2>
                <p className="font-body text-sm text-vb-silver/50">
                  Build the page from reusable content, media, catalog, and layout blocks.
                </p>
              </div>
              <select
                aria-label="Add section type"
                defaultValue=""
                onChange={(event) => {
                  const type = event.target.value as PageSectionType;
                  if (type) {
                    updatePage({ ...page, sections: [...page.sections, blankSection(type)] });
                    event.target.value = "";
                  }
                }}
                className="rounded-lg border border-white/10 bg-vb-black px-3 py-2 font-body text-sm text-vb-silver-bright"
              >
                <option value="">Add section…</option>
                {SECTION_TYPES.map(({ type, label }) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              {page.sections.map((section, index) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  preview={previewPage?.sections.find((candidate) => candidate.id === section.id)}
                  onChange={(patch) => updateSection(section.id, patch)}
                  onDelete={() =>
                    updatePage({
                      ...page,
                      sections: page.sections.filter((candidate) => candidate.id !== section.id),
                    })
                  }
                  onMove={(direction) => moveSection(index, direction)}
                />
              ))}
            </div>
          </section>
          <SeoEditor page={page} preview={previewPage} onChange={updatePage} />
          <FourthwallEditor settings={settings} onChange={updateSettings} />
        </div>
      </div>
    </div>
  );
}

function GlobalChromeEditor({
  settings,
  onChange,
}: {
  settings: SiteSettings;
  onChange: (patch: Partial<SiteSettings>) => void;
}) {
  const updateHeader = (patch: Partial<SiteSettings["header"]>) =>
    onChange({ header: { ...settings.header, ...patch } });
  const updateFooter = (patch: Partial<SiteSettings["footer"]>) =>
    onChange({ footer: { ...settings.footer, ...patch } });
  const updateSocial = (id: string, patch: Partial<SocialLink>) =>
    onChange({
      socials: settings.socials.map((social) =>
        social.id === id ? { ...social, ...patch } : social,
      ),
    });
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <h2 className="font-sub text-xl uppercase tracking-wide">Header & navigation</h2>
        <p className="mt-1 font-body text-sm text-vb-silver/50">
          Control the global header without affecting your saved page content.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Show wordmark"
            checked={settings.header.showWordmark}
            onChange={(checked) => updateHeader({ showWordmark: checked })}
          />
          <Toggle
            label="Keep header sticky"
            checked={settings.header.sticky}
            onChange={(checked) => updateHeader({ sticky: checked })}
          />
          <Toggle
            label="Transparent at top"
            checked={settings.header.transparentAtTop}
            onChange={(checked) => updateHeader({ transparentAtTop: checked })}
          />
          <Toggle
            label="Show cart button"
            checked={settings.header.showCart}
            onChange={(checked) => updateHeader({ showCart: checked })}
          />
          <Toggle
            label="Show header social icons"
            checked={settings.header.showSocialLinks}
            onChange={(checked) => updateHeader({ showSocialLinks: checked })}
          />
          <Field
            label="Header button label"
            value={settings.header.ctaLabel || ""}
            placeholder="Shop merch"
            onChange={(value) => updateHeader({ ctaLabel: value })}
          />
          <Field
            label="Header button destination"
            value={settings.header.ctaHref || ""}
            placeholder="/merch or https://…"
            onChange={(value) => updateHeader({ ctaHref: value })}
          />
        </div>
      </section>
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <h2 className="font-sub text-xl uppercase tracking-wide">Footer</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Show footer navigation"
            checked={settings.footer.showNavigation}
            onChange={(checked) => updateFooter({ showNavigation: checked })}
          />
          <Toggle
            label="Show newsletter form"
            checked={settings.footer.showNewsletter}
            onChange={(checked) => updateFooter({ showNewsletter: checked })}
          />
          <Field
            label="Contact email"
            value={settings.footer.contactEmail}
            onChange={(value) => updateFooter({ contactEmail: value })}
          />
          <Field
            label="Newsletter heading"
            value={settings.footer.newsletterHeading}
            onChange={(value) => updateFooter({ newsletterHeading: value })}
          />
          <Field
            label="Newsletter button"
            value={settings.footer.newsletterButton}
            onChange={(value) => updateFooter({ newsletterButton: value })}
          />
          <Field
            label="Footer legal line"
            value={settings.footer.legalLine}
            onChange={(value) => updateFooter({ legalLine: value })}
          />
        </div>
        <Textarea
          label="Footer description"
          value={settings.footer.description}
          onChange={(value) => updateFooter({ description: value })}
        />
      </section>
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 xl:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-sub text-xl uppercase tracking-wide">Social links</h2>
            <p className="font-body text-sm text-vb-silver/50">
              Add links once, then choose whether each appears in the header or footer.
            </p>
          </div>
          <button
            onClick={() =>
              onChange({
                socials: [
                  ...settings.socials,
                  {
                    id: newId("social"),
                    platform: "instagram",
                    label: "Instagram",
                    url: "https://instagram.com/",
                    showInFooter: true,
                    showInHeader: false,
                  },
                ],
              })
            }
            className="inline-flex items-center gap-2 rounded-lg border border-vb-purple/40 px-3 py-2 font-sub text-sm uppercase tracking-wide text-vb-purple-bright hover:bg-vb-purple/10"
          >
            <Plus size={15} /> Add social link
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {settings.socials.map((social) => (
            <div
              key={social.id}
              className="grid gap-3 rounded-xl border border-white/[0.07] bg-vb-black/40 p-3 md:grid-cols-[9rem_1fr_1.4fr_auto] md:items-end"
            >
              <SelectField
                label="Platform"
                value={social.platform}
                options={[
                  "instagram",
                  "tiktok",
                  "youtube",
                  "spotify",
                  "soundcloud",
                  "facebook",
                  "x",
                  "custom",
                ]}
                onChange={(value) => updateSocial(social.id, { platform: value as SocialPlatform })}
              />
              <Field
                label="Label"
                value={social.label}
                onChange={(value) => updateSocial(social.id, { label: value })}
              />
              <Field
                label="Full URL"
                value={social.url}
                placeholder="https://…"
                onChange={(value) => updateSocial(social.id, { url: value })}
              />
              <div className="flex items-center gap-3">
                <Toggle
                  label="Header"
                  checked={Boolean(social.showInHeader)}
                  onChange={(checked) => updateSocial(social.id, { showInHeader: checked })}
                />
                <Toggle
                  label="Footer"
                  checked={Boolean(social.showInFooter)}
                  onChange={(checked) => updateSocial(social.id, { showInFooter: checked })}
                />
                <button
                  aria-label={`Delete ${social.label}`}
                  onClick={() =>
                    onChange({
                      socials: settings.socials.filter((candidate) => candidate.id !== social.id),
                    })
                  }
                  className="rounded p-2 text-vb-silver/60 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PagePropertiesEditor({
  page,
  onChange,
}: {
  page: BuilderPage;
  onChange: (page: BuilderPage) => void;
}) {
  const setField = <K extends keyof BuilderPage>(field: K, value: BuilderPage[K]) =>
    onChange({ ...page, [field]: value });
  const updateLayout = (patch: NonNullable<BuilderPage["layout"]>) =>
    onChange({ ...page, layout: { ...page.layout, ...patch } });
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-sub text-xl uppercase tracking-wide">
            {page.isSystem ? "Core page settings" : "Custom page settings"}
          </h2>
          <p className="font-body text-sm text-vb-silver/50">
            {page.isSystem
              ? "The route is protected, but the content, layout, visibility, and navigation are fully editable."
              : "Set the URL, page chrome, and visibility before publishing."}
          </p>
        </div>
        {page.published && (
          <a
            href={page.path || `/${page.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-sub text-sm uppercase tracking-wide text-vb-purple-bright hover:text-white"
          >
            Preview live page <Eye size={15} />
          </a>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Page title"
          value={page.title}
          onChange={(value) => setField("title", value)}
        />
        <Field
          label="Navigation label"
          value={page.navLabel}
          onChange={(value) => setField("navLabel", value)}
        />
        <Field
          label={page.isSystem ? "Live path" : "URL path"}
          value={page.path || `/${page.slug}`}
          disabled={Boolean(page.isSystem)}
          onChange={(value) => {
            const path = value.startsWith("/") ? value : `/${value}`;
            onChange({
              ...page,
              path,
              slug:
                path === "/"
                  ? "home"
                  : path
                      .slice(1)
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-"),
            });
          }}
        />
        <SelectField
          label="Page background"
          value={page.layout?.background || "default"}
          options={["default", "mesh", "ink"]}
          onChange={(value) => updateLayout({ background: value as "default" | "mesh" | "ink" })}
        />
        <Toggle
          label="Published"
          checked={page.published}
          onChange={(checked) => setField("published", checked)}
        />
        <Toggle
          label="Show in header navigation"
          checked={page.showInNav}
          onChange={(checked) => setField("showInNav", checked)}
        />
        <Toggle
          label="Show in footer navigation"
          checked={Boolean(page.showInFooter)}
          onChange={(checked) => setField("showInFooter", checked)}
        />
        <Toggle
          label="Show global header"
          checked={page.layout?.showHeader !== false}
          onChange={(checked) => updateLayout({ showHeader: checked })}
        />
        <Toggle
          label="Show global footer"
          checked={page.layout?.showFooter !== false}
          onChange={(checked) => updateLayout({ showFooter: checked })}
        />
      </div>
    </section>
  );
}

function SectionEditor({
  section,
  preview,
  onChange,
  onDelete,
  onMove,
}: {
  section: PageSection;
  preview?: PageSection;
  onChange: (patch: Partial<PageSection>) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const layout = { ...DEFAULT_LAYOUT, ...section.layout };
  const updateLayout = (patch: Partial<SectionLayout>) =>
    onChange({ layout: { ...layout, ...patch } });
  const supportsCopy = !["divider", "spacer", "marquee"].includes(section.type);
  const supportsMedia = ["hero", "image", "video", "gallery"].includes(section.type);
  const supportsItems = ["gallery", "featureCards"].includes(section.type);
  const supportsCta = [
    "hero",
    "text",
    "callout",
    "pressKit",
    "featureCards",
    "licenseTiers",
    "featuredBeats",
  ].includes(section.type);
  return (
    <article className="rounded-xl border border-white/[0.08] bg-vb-black/50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GripVertical size={17} className="text-vb-silver/35" />
          <span className="font-sub uppercase tracking-wide text-vb-purple-bright">
            {SECTION_TYPES.find((candidate) => candidate.type === section.type)?.label ||
              section.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Move section up"
            onClick={() => onMove(-1)}
            className="rounded p-1.5 text-vb-silver/60 hover:bg-white/[0.06] hover:text-white"
          >
            <ChevronUp size={16} />
          </button>
          <button
            aria-label="Move section down"
            onClick={() => onMove(1)}
            className="rounded p-1.5 text-vb-silver/60 hover:bg-white/[0.06] hover:text-white"
          >
            <ChevronDown size={16} />
          </button>
          <button
            aria-label="Delete section"
            onClick={onDelete}
            className="rounded p-1.5 text-vb-silver/60 hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {section.type === "spacer" ? (
        <p className="font-body text-sm text-vb-silver/50">
          A breathing-space block. Use “Section spacing” below to set its height.
        </p>
      ) : section.type === "divider" ? (
        <p className="font-body text-sm text-vb-silver/50">
          A visual divider. Use the surface, width, and spacing controls below to create a
          transition.
        </p>
      ) : (
        <>
          {section.type === "marquee" ? (
            <Field
              label="Marquee text"
              value={section.title || ""}
              onChange={(value) => onChange({ title: value })}
            />
          ) : (
            <>
              {supportsCopy && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Eyebrow"
                    value={section.eyebrow || ""}
                    placeholder="Optional small heading"
                    onChange={(value) => onChange({ eyebrow: value })}
                  />
                  <Field
                    label={section.type === "image" ? "Image description" : "Headline"}
                    value={section.title || ""}
                    placeholder={
                      section.type === "image" ? "Used as accessible alt text" : "Write a headline"
                    }
                    onChange={(value) => onChange({ title: value })}
                  />
                </div>
              )}
              {supportsCopy && section.type !== "image" && (
                <Textarea
                  label="Text content"
                  value={section.body || ""}
                  placeholder="Write the supporting copy visitors will see."
                  onChange={(value) => onChange({ body: value })}
                />
              )}
              {supportsMedia && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ImageAssetField
                    label={section.type === "video" ? "Poster image" : "Section image"}
                    value={section.imageUrl || ""}
                    previewUrl={preview?.imageUrl}
                    hint="Upload a JPG, PNG, WebP, GIF, or AVIF image up to 10 MB."
                    onChange={(value) => onChange({ imageUrl: value })}
                  />
                  {section.type === "video" && (
                    <Field
                      label="Video URL"
                      value={section.videoUrl || ""}
                      placeholder="YouTube, Vimeo, or direct video URL"
                      onChange={(value) => onChange({ videoUrl: value })}
                    />
                  )}
                </div>
              )}
              {supportsItems && (
                <ItemsEditor
                  items={section.items || []}
                  previewItems={preview?.items || []}
                  label={section.type === "gallery" ? "Gallery images" : "Cards"}
                  onChange={(items) => onChange({ items })}
                />
              )}
              {section.type === "merch" && (
                <Field
                  label="Fourthwall collection"
                  value={section.collection || ""}
                  hint="Use `all` for every product, or enter the Fourthwall collection handle."
                  placeholder="all"
                  onChange={(value) => onChange({ collection: value })}
                />
              )}
              {supportsCta && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Primary button label"
                    value={section.ctaLabel || ""}
                    placeholder="Browse beats"
                    onChange={(value) => onChange({ ctaLabel: value })}
                  />
                  <Field
                    label="Primary button destination"
                    value={section.ctaHref || ""}
                    placeholder="/beats or https://…"
                    onChange={(value) => onChange({ ctaHref: value })}
                  />
                  <Field
                    label="Secondary button label"
                    value={section.secondaryCtaLabel || ""}
                    placeholder="Optional second action"
                    onChange={(value) => onChange({ secondaryCtaLabel: value })}
                  />
                  <Field
                    label="Secondary button destination"
                    value={section.secondaryCtaHref || ""}
                    placeholder="/about or https://…"
                    onChange={(value) => onChange({ secondaryCtaHref: value })}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
      <LayoutControls layout={layout} onChange={updateLayout} />
    </article>
  );
}

function ImageAssetField({
  label,
  hint,
  value,
  previewUrl,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  previewUrl?: string;
  onChange: (value: string) => void;
}) {
  const externalUrl = /^(https?:)?\/\//.test(value) || value.startsWith("/") ? value : "";
  const activePreview = value ? externalUrl || previewUrl : "";
  return (
    <div className="space-y-3">
      <FileUpload
        label={label}
        hint={hint}
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        folder="site-builder/images"
        kind="image"
        maxBytes={10 * 1024 * 1024}
        value={value}
        previewUrl={activePreview}
        onChange={onChange}
      />
      <Field
        label="Or use an image URL"
        value={externalUrl}
        hint="Keep using an existing hosted image by pasting its full URL here."
        placeholder="https://…"
        onChange={onChange}
      />
    </div>
  );
}

function ItemsEditor({
  items,
  previewItems,
  label,
  onChange,
}: {
  items: SectionItem[];
  previewItems: SectionItem[];
  label: string;
  onChange: (items: SectionItem[]) => void;
}) {
  const text = items
    .map((item) =>
      [item.title, item.body || "", item.imageUrl || "", item.label || "", item.href || ""].join(
        " | ",
      ),
    )
    .join("\n");
  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-body text-xs uppercase tracking-wider text-vb-silver/50">
          {label}
        </span>
        <button
          onClick={() => onChange([...items, { id: newId("item"), title: "New item" }])}
          className="inline-flex items-center gap-1 rounded border border-vb-purple/40 px-2 py-1 font-sub text-xs uppercase tracking-wide text-vb-purple-bright hover:bg-vb-purple/10"
        >
          <Plus size={13} /> Add item
        </button>
      </div>
      {items.length > 0 && (
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-body text-xs text-vb-silver/55">
                  {item.title || `Item ${index + 1}`}
                </span>
                <button
                  aria-label={`Remove ${item.title || `item ${index + 1}`}`}
                  onClick={() => onChange(items.filter((candidate) => candidate.id !== item.id))}
                  className="rounded p-1 text-vb-silver/45 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <FileUpload
                label={`${label.replace(/s$/, "")} ${index + 1} image`}
                hint="Upload a JPG, PNG, WebP, GIF, or AVIF image up to 10 MB."
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                folder="site-builder/images"
                kind="image"
                maxBytes={10 * 1024 * 1024}
                value={item.imageUrl || ""}
                previewUrl={previewItems.find((candidate) => candidate.id === item.id)?.imageUrl}
                onChange={(imageUrl) =>
                  onChange(
                    items.map((candidate) =>
                      candidate.id === item.id ? { ...candidate, imageUrl } : candidate,
                    ),
                  )
                }
              />
            </div>
          ))}
        </div>
      )}
      <label className="block font-body text-xs uppercase tracking-wider text-vb-silver/50">
        Bulk item editor
        <textarea
          aria-label={`${label} bulk editor`}
          value={text}
          onChange={(event) =>
            onChange(
              event.target.value
                .split("\n")
                .filter(Boolean)
                .map((line, index) => {
                  const [title = "", body = "", imageUrl = "", labelValue = "", href = ""] = line
                    .split("|")
                    .map((value) => value.trim());
                  return {
                    id: items[index]?.id || newId("item"),
                    title,
                    body,
                    imageUrl,
                    label: labelValue,
                    href,
                  };
                }),
            )
          }
          rows={Math.max(3, items.length + 1)}
          placeholder="Title | description | image URL | button label | link"
          className="mt-1.5 w-full rounded-lg border border-white/10 bg-vb-black px-3 py-2.5 font-body text-sm normal-case tracking-normal text-vb-silver-bright outline-none placeholder:text-vb-silver/25 focus:border-vb-purple-bright/60"
        />
        <span className="mt-1 block normal-case tracking-normal text-vb-silver/35">
          One item per line. Use the pipe character to separate title, text, image URL, optional
          button label, and optional link.
        </span>
      </label>
    </div>
  );
}

function LayoutControls({
  layout,
  onChange,
}: {
  layout: Required<SectionLayout>;
  onChange: (patch: Partial<SectionLayout>) => void;
}) {
  return (
    <details className="mt-4 border-t border-white/[0.07] pt-4">
      <summary className="cursor-pointer font-sub text-sm uppercase tracking-wide text-vb-silver/75 hover:text-vb-purple-bright">
        Advanced layout & media design
      </summary>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          label="Content width"
          value={layout.width}
          options={["narrow", "standard", "wide", "full"]}
          onChange={(value) => onChange({ width: value as Required<SectionLayout>["width"] })}
        />
        <SelectField
          label="Section spacing"
          value={layout.spacing}
          options={["tight", "normal", "relaxed", "cinematic"]}
          onChange={(value) => onChange({ spacing: value as Required<SectionLayout>["spacing"] })}
        />
        <SelectField
          label="Text alignment"
          value={layout.alignment}
          options={["left", "center", "right"]}
          onChange={(value) =>
            onChange({ alignment: value as Required<SectionLayout>["alignment"] })
          }
        />
        <SelectField
          label="Background treatment"
          value={layout.surface}
          options={["transparent", "ink", "mesh", "accent", "bordered"]}
          onChange={(value) => onChange({ surface: value as Required<SectionLayout>["surface"] })}
        />
        <SelectField
          label="Column count"
          value={String(layout.columns)}
          options={["1", "2", "3", "4"]}
          onChange={(value) => onChange({ columns: Number(value) as 1 | 2 | 3 | 4 })}
        />
        <SelectField
          label="Media placement"
          value={layout.mediaPosition}
          options={["none", "left", "right", "background", "top"]}
          onChange={(value) =>
            onChange({ mediaPosition: value as Required<SectionLayout>["mediaPosition"] })
          }
        />
        <SelectField
          label="Media fit"
          value={layout.mediaFit}
          options={["cover", "contain"]}
          onChange={(value) => onChange({ mediaFit: value as Required<SectionLayout>["mediaFit"] })}
        />
        <SelectField
          label="Media aspect"
          value={layout.mediaAspect}
          options={["auto", "square", "wide", "portrait", "cinema"]}
          onChange={(value) =>
            onChange({ mediaAspect: value as Required<SectionLayout>["mediaAspect"] })
          }
        />
        <SelectField
          label="Image overlay"
          value={layout.imageOverlay}
          options={["none", "soft", "strong"]}
          onChange={(value) =>
            onChange({ imageOverlay: value as Required<SectionLayout>["imageOverlay"] })
          }
        />
        <SelectField
          label="Corner style"
          value={layout.borderRadius}
          options={["none", "soft", "rounded"]}
          onChange={(value) =>
            onChange({ borderRadius: value as Required<SectionLayout>["borderRadius"] })
          }
        />
        <SelectField
          label="Text emphasis"
          value={layout.emphasis}
          options={["standard", "accent", "muted"]}
          onChange={(value) => onChange({ emphasis: value as Required<SectionLayout>["emphasis"] })}
        />
      </div>
    </details>
  );
}

function SeoEditor({
  page,
  preview,
  onChange,
}: {
  page: BuilderPage;
  preview?: BuilderPage;
  onChange: (page: BuilderPage) => void;
}) {
  const setSeo = (patch: NonNullable<BuilderPage["seo"]>) =>
    onChange({ ...page, seo: { ...page.seo, ...patch } });
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <h2 className="font-sub text-xl uppercase tracking-wide">Search & social sharing</h2>
      <p className="mt-1 font-body text-sm text-vb-silver/50">
        Set the page title, description, canonical URL, and social-card image.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field
          label="SEO title"
          value={page.seo?.title || ""}
          onChange={(value) => setSeo({ title: value })}
        />
        <Field
          label="Canonical path"
          value={page.seo?.canonicalPath || page.path || `/${page.slug}`}
          onChange={(value) =>
            setSeo({ canonicalPath: value.startsWith("/") ? value : `/${value}` })
          }
        />
      </div>
      <Textarea
        label="Meta description"
        value={page.seo?.description || ""}
        onChange={(value) => setSeo({ description: value.slice(0, 200) })}
      />
      <div className="mt-3">
        <ImageAssetField
          label="Open Graph social-card image"
          value={page.seo?.ogImageUrl || ""}
          previewUrl={preview?.seo?.ogImageUrl}
          hint="Upload the image used when this page is shared on social platforms."
          onChange={(value) => setSeo({ ogImageUrl: value })}
        />
      </div>
      <div className="mt-3">
        <Toggle
          label="Keep this page out of search indexes"
          checked={Boolean(page.seo?.noIndex)}
          onChange={(checked) => setSeo({ noIndex: checked })}
        />
      </div>
    </section>
  );
}

function FourthwallEditor({
  settings,
  onChange,
}: {
  settings: SiteSettings;
  onChange: (patch: Partial<SiteSettings>) => void;
}) {
  const set = (patch: Partial<SiteSettings["fourthwall"]>) =>
    onChange({ fourthwall: { ...settings.fourthwall, ...patch } });
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <h2 className="font-sub text-xl uppercase tracking-wide">Fourthwall storefront</h2>
      <p className="mt-1 font-body text-sm text-vb-silver/50">
        Merch sections load products securely from your existing Fourthwall shop.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field
          label="Shop domain"
          value={settings.fourthwall.shopDomain}
          onChange={(value) => set({ shopDomain: value.replace(/^https?:\/\//, "") })}
        />
        <Field
          label="Default collection"
          value={settings.fourthwall.defaultCollection}
          onChange={(value) => set({ defaultCollection: value })}
        />
        <Field
          label="Currency"
          value={settings.fourthwall.currency}
          onChange={(value) => set({ currency: value.toUpperCase().slice(0, 3) })}
        />
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block font-body text-xs uppercase tracking-wider text-vb-silver/50">
      {label}
      {hint && (
        <span className="mt-1 block normal-case tracking-normal text-vb-silver/35">{hint}</span>
      )}
      <input
        aria-label={label}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-white/10 bg-vb-black px-3 py-2.5 font-body text-sm normal-case tracking-normal text-vb-silver-bright outline-none placeholder:text-vb-silver/25 focus:border-vb-purple-bright/60 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}
function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="mt-3 block font-body text-xs uppercase tracking-wider text-vb-silver/50">
      {label}
      <textarea
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-1.5 w-full rounded-lg border border-white/10 bg-vb-black px-3 py-2.5 font-body text-sm normal-case tracking-normal text-vb-silver-bright outline-none placeholder:text-vb-silver/25 focus:border-vb-purple-bright/60"
      />
    </label>
  );
}
function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block font-body text-xs uppercase tracking-wider text-vb-silver/50">
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-white/10 bg-vb-black px-3 py-2.5 font-body text-sm normal-case tracking-normal text-vb-silver-bright outline-none focus:border-vb-purple-bright/60"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 font-body text-sm text-vb-silver/70">
      <input
        aria-label={label}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-vb-purple"
      />
      {label}
    </label>
  );
}
