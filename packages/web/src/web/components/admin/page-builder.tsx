/**
 * Vylanous Site Builder: dark industrial surfaces, chrome display type, and a
 * purple accent. Controls stay dense and purposeful while enabling full-site design.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Facebook,
  History,
  Redo2,
  Undo2,
  WandSparkles,
  GripVertical,
  Italic,
  Instagram,
  LayoutTemplate,
  Link2,
  Loader2,
  Monitor,
  Music2,
  Plus,
  PlusCircle,
  Save,
  Smartphone,
  Tablet,
  Trash2,
  Underline,
  Video,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { getAdminSettings, saveAdminSettings } from "../../lib/admin";
import { parseInlineText } from "../../lib/inline-text";
import { BUILDER_FONT_OPTIONS, FONT_PAIRS, type ThemeColors } from "../../../shared/site-settings";
import { FileUpload } from "./file-upload";
import type {
  BuilderPage,
  BuilderTemplate,
  BuilderVersion,
  PageLayout,
  PageSection,
  PageSectionType,
  PressKitBreakdown,
  PressKitData,
  PressKitMetric,
  PressKitPlatform,
  SectionItem,
  SectionLayout,
  SiteSettings,
  SocialLink,
  SocialPlatform,
} from "../../../shared/site-settings";

const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string; Icon: LucideIcon }[] = [
  { value: "instagram", label: "Instagram", Icon: Instagram },
  { value: "tiktok", label: "TikTok", Icon: Video },
  { value: "youtube", label: "YouTube", Icon: Youtube },
  { value: "spotify", label: "Spotify", Icon: Music2 },
  { value: "soundcloud", label: "SoundCloud", Icon: Music2 },
  { value: "facebook", label: "Facebook", Icon: Facebook },
  { value: "x", label: "X", Icon: Link2 },
  { value: "custom", label: "Custom link", Icon: Link2 },
];

const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "primaryBright", label: "Primary glow" },
  { key: "primaryDeep", label: "Primary deep" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "surfaceHover", label: "Surface hover" },
  { key: "text", label: "Text" },
  { key: "muted", label: "Muted text" },
];

const DEVICE_OPTIONS = [
  { value: "desktop", label: "Desktop", Icon: Monitor, canvasClass: "w-full" },
  { value: "tablet", label: "Tablet", Icon: Tablet, canvasClass: "w-[720px] max-w-full" },
  { value: "mobile", label: "Mobile", Icon: Smartphone, canvasClass: "w-[390px] max-w-full" },
] as const;

const PRESS_KIT_PLATFORMS: { value: PressKitPlatform; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "spotify", label: "Spotify" },
  { value: "soundcloud", label: "SoundCloud" },
  { value: "x", label: "X" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
];

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
  palette: "brand",
  headingScale: "standard",
  paddingX: "normal",
  shadow: "none",
  borderStyle: "none",
  customColor: "",
  fontFamily: "anton",
  bodyFontFamily: "barlow",
  eyebrowSize: "16px",
  headingSize: "64px",
  bodySize: "18px",
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
    showChildNavigation: false,
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
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [focusedSectionId, setFocusedSectionId] = useState("");
  const [showBlockLibrary, setShowBlockLibrary] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [draftSaveState, setDraftSaveState] = useState<"saved" | "unsaved" | "saving" | "error">(
    "saved",
  );
  const [draggingSectionId, setDraggingSectionId] = useState("");
  const [dragOverSectionId, setDragOverSectionId] = useState("");
  const historyRef = useRef<{ past: SiteSettings[]; future: SiteSettings[] }>({
    past: [],
    future: [],
  });
  const hydratedRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getAdminSettings()
      .then(({ settings: loaded, preview }) => {
        setSettings(loaded);
        setPreviews(preview);
        setSelectedId(loaded.pages[0]?.id || "");
        setFocusedSectionId(loaded.pages[0]?.sections[0]?.id || "");
        hydratedRef.current = true;
        setDraftSaveState("saved");
      })
      .catch(() => setNotice("Unable to load site-builder settings."));
  }, []);

  const page = useMemo(
    () => settings?.pages.find((candidate) => candidate.id === selectedId) || settings?.pages[0],
    [selectedId, settings],
  );

  useEffect(() => {
    if (!settings || !page || !hydratedRef.current || draftSaveState !== "unsaved") return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      setDraftSaveState("saving");
      const draft = {
        id: `draft_${page.id}`,
        pageId: page.id,
        updatedAt: new Date().toISOString(),
        snapshot: page,
      };
      try {
        await saveAdminSettings({
          builder: {
            ...settings.builder,
            drafts: [...settings.builder.drafts.filter((item) => item.pageId !== page.id), draft],
          },
        });
        setDraftSaveState("saved");
      } catch {
        setDraftSaveState("error");
      }
    }, 900);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [draftSaveState, page, settings]);

  const updateSettings = (patch: Partial<SiteSettings>) => {
    setSettings((current) => {
      if (!current) return current;
      historyRef.current.past = [...historyRef.current.past.slice(-29), current];
      historyRef.current.future = [];
      return { ...current, ...patch };
    });
    setDraftSaveState("unsaved");
  };

  const undo = () => {
    setSettings((current) => {
      const previous = historyRef.current.past.pop();
      if (!current || !previous) return current;
      historyRef.current.future.push(current);
      setDraftSaveState("unsaved");
      return previous;
    });
  };

  const redo = () => {
    setSettings((current) => {
      const next = historyRef.current.future.pop();
      if (!current || !next) return current;
      historyRef.current.past.push(current);
      setDraftSaveState("unsaved");
      return next;
    });
  };

  const updatePage = (next: BuilderPage) => {
    if (!settings) return;
    updateSettings({
      pages: settings.pages.map((candidate) => (candidate.id === next.id ? next : candidate)),
    });
  };

  const deletePage = (target: BuilderPage) => {
    if (!settings || target.isSystem) {
      setNotice("Core pages stay protected and cannot be deleted.");
      return;
    }
    const children = settings.pages.filter((candidate) => candidate.parentPageId === target.id);
    const childMessage = children.length
      ? ` ${children.length} child ${children.length === 1 ? "page will" : "pages will"} remain published as standalone pages at their current URLs.`
      : "";
    if (!window.confirm(`Delete “${target.title}”? This cannot be undone.${childMessage}`)) return;
    const remainingPages = settings.pages
      .filter((candidate) => candidate.id !== target.id)
      .map((candidate) =>
        candidate.parentPageId === target.id ? { ...candidate, parentPageId: undefined } : candidate,
      );
    const nextPage = remainingPages.find((candidate) => !candidate.isSystem) || remainingPages[0];
    updateSettings({ pages: remainingPages });
    setSelectedId(nextPage?.id || "");
    setFocusedSectionId(nextPage?.sections[0]?.id || "");
    setNotice(
      children.length
        ? `Deleted ${target.title}. Its child pages are now standalone; review their parent and path settings.`
        : `Deleted ${target.title}.`,
    );
  };

  const save = async (checkpointLabel?: string) => {
    if (!settings) return;
    setSaving(true);
    setNotice("");
    try {
      const builder = checkpointLabel
        ? {
            ...settings.builder,
            versions: [
              ...settings.builder.versions.slice(-49),
              {
                id: newId("version"),
                pageId: page?.id || settings.pages[0]?.id || "",
                label: checkpointLabel,
                createdAt: new Date().toISOString(),
                snapshot: page || settings.pages[0],
              } as BuilderVersion,
            ],
          }
        : settings.builder;
      await saveAdminSettings({
        theme: settings.theme,
        fontId: settings.fontId,
        brand: settings.brand,
        pages: settings.pages,
        fourthwall: settings.fourthwall,
        header: settings.header,
        footer: settings.footer,
        socials: settings.socials,
        builder,
      });
      const refreshed = await getAdminSettings();
      setSettings(refreshed.settings);
      setPreviews(refreshed.preview);
      setDraftSaveState("saved");
      setNotice(
        checkpointLabel
          ? `Published checkpoint: ${checkpointLabel}`
          : "Saved. Your live design, navigation, and global chrome update immediately.",
      );
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
  const reorderSection = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    const fromIndex = page.sections.findIndex((section) => section.id === fromId);
    const toIndex = page.sections.findIndex((section) => section.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const sections = [...page.sections];
    const [moved] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, moved);
    updatePage({ ...page, sections });
    setFocusedSectionId(toId);
    setDraggingSectionId("");
    setDragOverSectionId("");
  };

  const duplicateSection = (id: string) => {
    const original = page.sections.find((section) => section.id === id);
    if (!original) return;
    const index = page.sections.findIndex((section) => section.id === id);
    const duplicate: PageSection = {
      ...original,
      id: newId("section"),
      title: original.title ? `${original.title} copy` : "New section",
      items: original.items?.map((item) => ({ ...item, id: newId("item") })),
    };
    const sections = [...page.sections];
    sections.splice(index + 1, 0, duplicate);
    updatePage({ ...page, sections });
    setFocusedSectionId(duplicate.id);
  };
  const createTemplate = () => {
    const name = window.prompt("Name this reusable section template", `${page.title} blocks`);
    if (!name?.trim()) return;
    const template: BuilderTemplate = {
      id: newId("template"),
      name: name.trim(),
      description: `Reusable blocks from ${page.title}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: page.sections,
    };
    updateSettings({
      builder: { ...settings.builder, templates: [...settings.builder.templates, template] },
    });
    setNotice(`Template saved: ${template.name}`);
  };

  const applyTemplate = (template: BuilderTemplate) => {
    const sections = template.sections.map((section) => ({
      ...section,
      id: newId("section"),
      items: section.items?.map((item) => ({ ...item, id: newId("item") })),
    }));
    updatePage({ ...page, sections });
    setFocusedSectionId(sections[0]?.id || "");
    setShowTemplateLibrary(false);
    setNotice(`Template inserted: ${template.name}`);
  };

  const restoreVersion = (version: BuilderVersion) => {
    if (
      !window.confirm(
        `Restore “${version.label}” to this page? Your current state remains available through undo.`,
      )
    )
      return;
    updatePage(version.snapshot);
    setNotice(`Restored checkpoint: ${version.label}`);
  };

  const previewPage = previews?.pages.find((candidate) => candidate.id === page.id);
  const focusSection = (id: string) => {
    setFocusedSectionId(id);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`builder-section-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

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
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-body text-xs ${draftSaveState === "error" ? "border-red-400/30 text-red-300" : draftSaveState === "saving" ? "border-amber-300/30 text-amber-200" : draftSaveState === "unsaved" ? "border-vb-purple/30 text-vb-purple-bright" : "border-emerald-300/20 text-emerald-200"}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {draftSaveState === "saving"
              ? "Autosaving"
              : draftSaveState === "unsaved"
                ? "Unsaved changes"
                : draftSaveState === "error"
                  ? "Autosave failed"
                  : "Draft saved"}
          </div>
          <button
            type="button"
            title="Undo"
            aria-label="Undo last change"
            onClick={undo}
            disabled={!historyRef.current.past.length}
            className="rounded-lg border border-white/10 p-2.5 text-vb-silver/70 hover:border-vb-purple/50 hover:text-white disabled:opacity-30"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            title="Redo"
            aria-label="Redo last change"
            onClick={redo}
            disabled={!historyRef.current.future.length}
            className="rounded-lg border border-white/10 p-2.5 text-vb-silver/70 hover:border-vb-purple/50 hover:text-white disabled:opacity-30"
          >
            <Redo2 size={16} />
          </button>
          <button
            type="button"
            onClick={createTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2.5 font-sub text-xs uppercase tracking-wide text-vb-silver/75 hover:border-vb-purple/50 hover:text-white"
          >
            <WandSparkles size={15} /> Save template
          </button>
          <button
            type="button"
            onClick={() => setShowTemplateLibrary((open) => !open)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2.5 font-sub text-xs uppercase tracking-wide text-vb-silver/75 hover:border-vb-purple/50 hover:text-white"
          >
            <LayoutTemplate size={15} /> Templates
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-vb-purple px-4 py-2.5 font-sub uppercase tracking-wide text-white transition hover:bg-vb-purple-bright disabled:opacity-60"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {saving ? "Saving" : "Save site design"}
          </button>
        </div>
      </div>
      {notice && <p className="mb-4 font-body text-sm text-vb-purple-bright">{notice}</p>}
      {showTemplateLibrary && (
        <section className="mb-5 rounded-2xl border border-vb-purple/20 bg-vb-purple/[0.06] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-sub text-lg uppercase tracking-wide">Reusable templates</h2>
              <p className="font-body text-xs text-vb-silver/50">
                Insert a saved block composition into the current page.
              </p>
            </div>
            <span className="font-mono text-xs text-vb-silver/35">
              {settings.builder.templates.length} saved
            </span>
          </div>
          {settings.builder.templates.length ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {settings.builder.templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-xl border border-white/[0.08] bg-vb-black/50 p-3"
                >
                  <p className="font-sub text-sm uppercase text-vb-silver-bright">
                    {template.name}
                  </p>
                  <p className="mt-1 font-body text-xs text-vb-silver/45">
                    {template.sections.length} blocks · {template.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="mt-3 rounded-lg bg-vb-purple/80 px-3 py-2 font-sub text-[10px] uppercase tracking-wide text-white hover:bg-vb-purple-bright"
                  >
                    Insert template
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 font-body text-sm text-vb-silver/45">
              Save your first template from the current page to reuse its composition.
            </p>
          )}
          <div className="mt-5 border-t border-white/[0.08] pt-4">
            <div className="flex items-center gap-2">
              <History size={15} className="text-vb-purple-bright" />
              <span className="font-sub text-xs uppercase tracking-[0.16em] text-vb-silver/55">
                Version checkpoints
              </span>
            </div>
            {settings.builder.versions.filter((version) => version.pageId === page.id).length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {settings.builder.versions
                  .filter((version) => version.pageId === page.id)
                  .slice()
                  .reverse()
                  .map((version) => (
                    <button
                      type="button"
                      key={version.id}
                      onClick={() => restoreVersion(version)}
                      className="rounded-lg border border-white/[0.08] px-3 py-2 text-left hover:border-vb-purple/50"
                    >
                      <span className="block font-body text-xs text-vb-silver-bright">
                        {version.label}
                      </span>
                      <span className="block font-mono text-[10px] text-vb-silver/35">
                        {new Date(version.createdAt).toLocaleString()}
                      </span>
                    </button>
                  ))}
              </div>
            ) : (
              <p className="mt-3 font-body text-xs text-vb-silver/40">
                No checkpoints yet. Save the site design to create the first draft, then publish a
                named checkpoint from the studio.
              </p>
            )}
          </div>
        </section>
      )}

      <section className="mb-5 overflow-hidden rounded-2xl border border-white/[0.1] bg-vb-ink shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-vb-black/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <LayoutTemplate size={17} className="text-vb-purple-bright" />
            <div>
              <p className="font-sub text-sm uppercase tracking-[0.18em] text-vb-silver-bright">
                Builder studio
              </p>
              <p className="font-body text-xs text-vb-silver/45">
                Compose, preview, and publish every breakpoint from one workspace.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                window.open(page.path || `/${page.slug}`, "_blank", "noopener,noreferrer")
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 font-sub text-xs uppercase tracking-wide text-vb-silver/75 hover:border-vb-purple/50 hover:text-white"
            >
              <Eye size={14} /> Preview live page
            </button>
            <button
              type="button"
              onClick={() => {
                const label = window.prompt(
                  "Name this publish checkpoint",
                  `${page.title} checkpoint`,
                );
                if (label?.trim()) void save(label.trim());
              }}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-vb-purple/40 px-3 py-2 font-sub text-xs uppercase tracking-wide text-vb-purple-bright hover:bg-vb-purple/10 disabled:opacity-60"
            >
              <History size={14} /> Checkpoint
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-vb-purple px-3 py-2 font-sub text-xs uppercase tracking-wide text-white hover:bg-vb-purple-bright disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving" : "Save changes"}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-2.5">
          <div
            className="flex items-center gap-1 rounded-lg bg-vb-black/70 p-1"
            aria-label="Preview device"
          >
            {DEVICE_OPTIONS.map(({ value, label, Icon }) => (
              <button
                type="button"
                key={value}
                aria-pressed={device === value}
                onClick={() => setDevice(value)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-sub text-xs uppercase tracking-wide transition ${device === value ? "bg-vb-purple/25 text-vb-purple-bright" : "text-vb-silver/45 hover:text-vb-silver"}`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          <span className="font-body text-xs text-vb-silver/40">
            Editing {page.title} · {page.sections.length} blocks ·{" "}
            {page.published ? "Published" : "Draft"}
          </span>
        </div>
        <BuilderCanvas
          page={page}
          device={device}
          focusedSectionId={focusedSectionId}
          onFocus={focusSection}
          onReorder={reorderSection}
          draggingSectionId={draggingSectionId}
          dragOverSectionId={dragOverSectionId}
          onDragStart={setDraggingSectionId}
          onDragOver={setDragOverSectionId}
          onDragEnd={() => {
            if (draggingSectionId && dragOverSectionId)
              reorderSection(draggingSectionId, dragOverSectionId);
            else setDraggingSectionId("");
          }}
        />
      </section>

      <GlobalChromeEditor settings={settings} onChange={updateSettings} />
      <StyleStudio settings={settings} onChange={updateSettings} />

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
          <PagePropertiesEditor
            page={page}
            pages={settings.pages}
            onChange={updatePage}
            onDelete={() => deletePage(page)}
          />
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-sub text-xl uppercase tracking-wide">Page sections</h2>
                <p className="font-body text-sm text-vb-silver/50">
                  Build the page from reusable content, media, catalog, and layout blocks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBlockLibrary((open) => !open);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-vb-purple px-3 py-2 font-sub text-xs uppercase tracking-wide text-white hover:bg-vb-purple-bright"
              >
                <PlusCircle size={15} /> Add block
              </button>
            </div>
            {showBlockLibrary && (
              <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-vb-purple/20 bg-vb-purple/[0.06] p-3 sm:grid-cols-4">
                {SECTION_TYPES.map(({ type, label }) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => {
                      const next = blankSection(type);
                      updatePage({ ...page, sections: [...page.sections, next] });
                      setFocusedSectionId(next.id);
                      setShowBlockLibrary(false);
                    }}
                    className="rounded-lg border border-white/[0.08] bg-vb-black/50 px-2.5 py-2.5 text-left font-body text-xs text-vb-silver/70 transition hover:border-vb-purple/50 hover:text-vb-purple-bright"
                  >
                    <span className="block font-sub uppercase tracking-wide">{label}</span>
                    <span className="mt-0.5 block text-[10px] text-vb-silver/35">Add block</span>
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-4">
              {page.sections.map((section, index) => (
                <div id={`builder-section-${section.id}`} key={section.id}>
                  <SectionEditor
                    section={section}
                    preview={previewPage?.sections.find((candidate) => candidate.id === section.id)}
                    fourthwall={settings.fourthwall}
                    socials={settings.socials}
                    pageLayout={page.layout}
                    pageLayoutPreview={previewPage?.layout}
                    onPageLayoutChange={(layoutPatch) => updatePage({ ...page, layout: { ...page.layout, ...layoutPatch } })}
                    onFourthwallChange={(patch) =>
                      updateSettings({ fourthwall: { ...settings.fourthwall, ...patch } })
                    }
                    onChange={(patch) => updateSection(section.id, patch)}
                    onDuplicate={() => duplicateSection(section.id)}
                    onDelete={() =>
                      updatePage({
                        ...page,
                        sections: page.sections.filter((candidate) => candidate.id !== section.id),
                      })
                    }
                    onMove={(direction) => moveSection(index, direction)}
                  />
                </div>
              ))}
            </div>
          </section>
          <SeoEditor page={page} preview={previewPage} onChange={updatePage} />
        </div>
      </div>
    </div>
  );
}

function BuilderCanvas({
  page,
  device,
  focusedSectionId,
  onFocus,
  onReorder,
  draggingSectionId,
  dragOverSectionId,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  page: BuilderPage;
  device: "desktop" | "tablet" | "mobile";
  focusedSectionId: string;
  onFocus: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
  draggingSectionId: string;
  dragOverSectionId: string;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDragEnd: () => void;
}) {
  const deviceOption =
    DEVICE_OPTIONS.find((option) => option.value === device) || DEVICE_OPTIONS[0];
  return (
    <div className="grid gap-4 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.14),transparent_38%),#0b0b0f] p-4 sm:grid-cols-[13rem_minmax(0,1fr)] sm:p-6">
      <aside className="rounded-xl border border-white/[0.08] bg-vb-black/60 p-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-sub text-[10px] uppercase tracking-[0.18em] text-vb-silver/50">
            Page outline
          </span>
          <span className="font-body text-[10px] text-vb-silver/30">{page.sections.length}</span>
        </div>
        <div className="space-y-1">
          {page.sections.map((section, index) => {
            const label =
              SECTION_TYPES.find((candidate) => candidate.type === section.type)?.label ||
              section.type;
            return (
              <button
                type="button"
                draggable
                key={section.id}
                onClick={() => onFocus(section.id)}
                onDragStart={() => onDragStart(section.id)}
                onDragOver={(event) => {
                  event.preventDefault();
                  onDragOver(section.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggingSectionId) onReorder(draggingSectionId, section.id);
                }}
                onPointerDown={() => onDragStart(section.id)}
                onPointerEnter={() => {
                  if (draggingSectionId && draggingSectionId !== section.id) onDragOver(section.id);
                }}
                onPointerUp={() => {
                  if (draggingSectionId) onReorder(draggingSectionId, section.id);
                }}
                onDragEnd={onDragEnd}
                className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${dragOverSectionId === section.id ? "border-vb-purple-bright bg-vb-purple/15" : "border-transparent"} ${focusedSectionId === section.id ? "bg-vb-purple/20 text-vb-purple-bright" : "text-vb-silver/50 hover:bg-white/[0.05] hover:text-vb-silver"}`}
              >
                <span className="font-mono text-[10px] text-vb-silver/30">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 truncate font-body text-xs">{section.title || label}</span>
              </button>
            );
          })}
        </div>
      </aside>
      <div className="overflow-x-auto">
        <div className={`mx-auto transition-[width] duration-200 ${deviceOption.canvasClass}`}>
          <div className="overflow-hidden rounded-[1.25rem] border border-white/15 bg-vb-black shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-red-400/80" />
              <span className="h-2 w-2 rounded-full bg-amber-300/80" />
              <span className="h-2 w-2 rounded-full bg-emerald-300/80" />
              <span className="ml-2 truncate font-body text-[10px] text-vb-silver/35">
                {page.path || `/${page.slug}`}
              </span>
            </div>
            <div className="space-y-2 bg-vb-black/80 p-2">
              {page.sections.map((section, index) => {
                const sectionLabel =
                  SECTION_TYPES.find((candidate) => candidate.type === section.type)?.label ||
                  section.type;
                const hasMedia = Boolean(
                  section.imageUrl || section.items?.some((item) => item.imageUrl),
                );
                return (
                  <button
                    type="button"
                    key={section.id}
                    onClick={() => onFocus(section.id)}
                    className={`group relative block w-full overflow-hidden rounded-xl border text-left transition ${focusedSectionId === section.id ? "border-vb-purple-bright bg-vb-purple/[0.12] shadow-lg shadow-vb-purple/10" : "border-white/[0.08] bg-white/[0.025] hover:border-vb-purple/50"}`}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2">
                      <span className="flex items-center gap-2 font-sub text-[10px] uppercase tracking-[0.16em] text-vb-purple-bright">
                        <GripVertical size={13} className="text-vb-silver/30" />{" "}
                        {String(index + 1).padStart(2, "0")} · {sectionLabel}
                      </span>
                      <span className="font-body text-[10px] text-vb-silver/35">Click to edit</span>
                    </div>
                    <div
                      className={`min-h-20 p-4 ${section.type === "hero" ? "bg-gradient-to-br from-vb-purple/20 via-vb-black to-vb-black" : ""}`}
                    >
                      {section.eyebrow && (
                        <p className="font-sub text-[9px] uppercase tracking-[0.25em] text-vb-purple-bright">
                          {section.eyebrow}
                        </p>
                      )}
                      {section.title && (
                        <h3 className="mt-1 font-display text-xl uppercase leading-none text-chrome sm:text-2xl">
                          {section.title}
                        </h3>
                      )}
                      {section.body && (
                        <p className="mt-2 line-clamp-2 max-w-2xl font-body text-xs leading-relaxed text-vb-silver/55">
                          <FormattedText value={section.body} formatted={section.bodyFormat === "inline"} />
                        </p>
                      )}
                      {hasMedia && (
                        <div
                          className="mt-3 h-12 rounded-lg border border-dashed border-vb-purple/30 bg-vb-purple/[0.08]"
                          aria-label="Media preview"
                        />
                      )}
                      {!section.title && !section.body && !hasMedia && (
                        <p className="font-body text-xs text-vb-silver/35">
                          Empty block — add content in the inspector below.
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StyleStudio({
  settings,
  onChange,
}: {
  settings: SiteSettings;
  onChange: (patch: Partial<SiteSettings>) => void;
}) {
  const setColor = (key: keyof ThemeColors, value: string) =>
    onChange({ theme: { ...settings.theme, [key]: value } });
  return (
    <section className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-sub text-xl uppercase tracking-wide">Style studio</h2>
          <p className="mt-1 font-body text-sm text-vb-silver/50">
            Reskin the entire site with visual presets, color tokens, and type systems.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 px-3 py-2 font-body text-xs text-vb-silver/45">
          Global styles
        </div>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-white/[0.07] bg-vb-black/40 p-4">
          <p className="mb-3 font-sub text-xs uppercase tracking-[0.18em] text-vb-silver/50">
            Color tokens
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COLOR_FIELDS.map(({ key, label }) => (
              <label
                key={key}
                className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2"
              >
                <span className="mb-1 block truncate font-body text-[10px] text-vb-silver/45">
                  {label}
                </span>
                <span className="flex items-center gap-1.5">
                  <input
                    type="color"
                    aria-label={`${label} color`}
                    value={settings.theme[key]}
                    onChange={(event) => setColor(key, event.target.value)}
                    className="h-7 w-7 shrink-0 cursor-pointer rounded border border-white/10 bg-transparent"
                  />
                  <input
                    aria-label={`${label} hex value`}
                    value={settings.theme[key]}
                    onChange={(event) => setColor(key, event.target.value)}
                    className="min-w-0 w-full bg-transparent font-mono text-[10px] text-vb-silver/65 outline-none"
                  />
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-vb-black/40 p-4">
          <p className="mb-3 font-sub text-xs uppercase tracking-[0.18em] text-vb-silver/50">
            Typography presets
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {FONT_PAIRS.map((pair) => (
              <button
                type="button"
                key={pair.id}
                aria-pressed={settings.fontId === pair.id}
                onClick={() => onChange({ fontId: pair.id })}
                className={`rounded-lg border px-3 py-2 text-left transition ${settings.fontId === pair.id ? "border-vb-purple-bright bg-vb-purple/15" : "border-white/[0.07] hover:border-vb-purple/40"}`}
              >
                <span className="block font-body text-xs text-vb-silver-bright">{pair.label}</span>
                <span className="mt-0.5 block font-mono text-[10px] text-vb-silver/40">
                  {pair.display.split(",")[0].replace(/'/g, "")} +{" "}
                  {pair.body.split(",")[0].replace(/'/g, "")}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div
        className="mt-4 overflow-hidden rounded-xl border border-white/[0.07] p-5"
        style={{ background: settings.theme.background }}
      >
        <p
          className="font-display text-3xl uppercase leading-none"
          style={{ color: settings.theme.text }}
        >
          Vylanous / Your new direction
        </p>
        <p
          className="mt-2 font-sub text-xs uppercase tracking-[0.25em]"
          style={{ color: settings.theme.primaryBright }}
        >
          Global preview · responsive by default
        </p>
        <button
          type="button"
          className="mt-4 rounded-lg px-4 py-2 font-sub text-xs uppercase tracking-wider text-white"
          style={{ background: settings.theme.primary }}
        >
          Primary action
        </button>
      </div>
    </section>
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
  const updatePopup = (patch: Partial<SiteSettings["newsletterPopup"]>) =>
    onChange({ newsletterPopup: { ...settings.newsletterPopup, ...patch } });
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-sub text-xl uppercase tracking-wide">Newsletter popup</h2>
            <p className="mt-1 max-w-2xl font-body text-sm text-vb-silver/50">
              Invite visitors to join the fan list with a branded popup. Existing subscribers are
              stored in the admin Fan List.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle
              label="Enable popup"
              checked={settings.newsletterPopup.enabled}
              onChange={(enabled) => updatePopup({ enabled })}
            />
            <Toggle
              label="Show once per session"
              checked={settings.newsletterPopup.showOnce}
              onChange={(showOnce) => updatePopup({ showOnce })}
            />
            <Toggle
              label="Home page only"
              checked={settings.newsletterPopup.homeOnly}
              onChange={(homeOnly) => updatePopup({ homeOnly })}
            />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field
            label="Popup title"
            value={settings.newsletterPopup.title}
            onChange={(title) => updatePopup({ title })}
          />
          <Field
            label="Email placeholder"
            value={settings.newsletterPopup.placeholder}
            onChange={(placeholder) => updatePopup({ placeholder })}
          />
          <Field
            label="Button label"
            value={settings.newsletterPopup.buttonLabel}
            onChange={(buttonLabel) => updatePopup({ buttonLabel })}
          />
          <Field
            label="Dismiss label"
            value={settings.newsletterPopup.dismissLabel}
            onChange={(dismissLabel) => updatePopup({ dismissLabel })}
          />
          <Field
            label="Consent checkbox text"
            value={settings.newsletterPopup.consentText}
            onChange={(consentText) => updatePopup({ consentText })}
          />
          <Field
            label="Delay before showing (ms)"
            hint="0 shows immediately; maximum 60000."
            value={String(settings.newsletterPopup.delayMs)}
            onChange={(value) => {
              const delayMs = Math.min(
                60_000,
                Math.max(0, Number(value.replace(/[^0-9]/g, "")) || 0),
              );
              updatePopup({ delayMs });
            }}
          />
        </div>
        <Textarea
          label="Popup message"
          value={settings.newsletterPopup.body}
          onChange={(body) => updatePopup({ body })}
        />
        <Textarea
          label="Success message"
          value={settings.newsletterPopup.successMessage}
          onChange={(successMessage) => updatePopup({ successMessage })}
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
              <div>
                <span className="mb-1.5 block font-body text-xs uppercase tracking-wider text-vb-silver/50">
                  Platform icon
                </span>
                <div
                  className="grid grid-cols-4 gap-1.5"
                  role="radiogroup"
                  aria-label="Social platform"
                >
                  {SOCIAL_PLATFORMS.map(({ value, label: platformLabel, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={social.platform === value}
                      aria-label={platformLabel}
                      title={platformLabel}
                      onClick={() => updateSocial(social.id, { platform: value })}
                      className={`grid h-9 place-items-center rounded-md border transition ${
                        social.platform === value
                          ? "border-vb-purple-bright bg-vb-purple/20 text-vb-purple-bright"
                          : "border-white/10 text-vb-silver/45 hover:border-white/25 hover:text-vb-silver"
                      }`}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>
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
  pages,
  onChange,
  onDelete,
}: {
  page: BuilderPage;
  pages: BuilderPage[];
  onChange: (page: BuilderPage) => void;
  onDelete: () => void;
}) {
  const setField = <K extends keyof BuilderPage>(field: K, value: BuilderPage[K]) =>
    onChange({ ...page, [field]: value });
  const updateLayout = (patch: NonNullable<BuilderPage["layout"]>) =>
    onChange({ ...page, layout: { ...page.layout, ...patch } });
  const updateSeo = (patch: NonNullable<BuilderPage["seo"]>) =>
    onChange({ ...page, seo: { ...page.seo, ...patch } });
  const eligibleParents = pages.filter(
    (candidate) => candidate.id !== page.id && candidate.parentPageId !== page.id,
  );
  const parent = pages.find((candidate) => candidate.id === page.parentPageId);
  const childPages = pages.filter((candidate) => candidate.parentPageId === page.id);
  const leafSlug = (page.path || page.slug).split("/").filter(Boolean).pop() || page.slug;
  const nestedPath = (parentPage: BuilderPage, leaf: string) =>
    `${(parentPage.path || `/${parentPage.slug}`).replace(/\/+$/, "")}/${leaf.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
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
        <div className="flex flex-wrap items-center gap-3">
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
          {!page.isSystem && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-2 font-sub text-xs uppercase tracking-wide text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
            >
              <Trash2 size={14} /> Delete page
            </button>
          )}
        </div>
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
          label="SEO title"
          value={page.seo?.title || ""}
          hint="The title shown in browser tabs and social previews. Keep it under 70 characters."
          placeholder={`${page.title} | Vylanous Beats`}
          onChange={(value) => updateSeo({ title: value })}
        />
        <Textarea
          label="SEO description"
          value={page.seo?.description || ""}
          hint="A concise search and social summary. Keep it under 200 characters."
          placeholder="Describe what visitors will find on this page."
          onChange={(value) => updateSeo({ description: value })}
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
        <label className="block font-body text-xs uppercase tracking-wider text-vb-silver/60">
          Parent page
          <span className="mt-1 block normal-case tracking-normal text-vb-silver/35">
            Choose a parent to create a child route and local sub-navigation relationship.
          </span>
          <select
            aria-label="Parent page"
            value={page.parentPageId || "none"}
            onChange={(event) => {
              const nextParent = pages.find((candidate) => candidate.id === event.target.value);
              onChange({
                ...page,
                parentPageId: nextParent?.id || undefined,
                path: nextParent ? nestedPath(nextParent, leafSlug) : `/${leafSlug}`,
                slug: leafSlug,
              });
            }}
            className="mt-2 w-full rounded-lg border border-white/10 bg-vb-black/50 px-3 py-2.5 font-body text-sm normal-case tracking-normal text-vb-silver-bright outline-none focus:border-vb-purple-bright"
          >
            <option value="none">No parent — top-level page</option>
            {eligibleParents.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.title} · {candidate.path || `/${candidate.slug}`}
              </option>
            ))}
          </select>
        </label>
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
          label="Show in main header navigation"
          checked={page.showInNav}
          onChange={(checked) => setField("showInNav", checked)}
        />
        <Toggle
          label="Show in main footer navigation"
          checked={Boolean(page.showInFooter)}
          onChange={(checked) => setField("showInFooter", checked)}
        />
        <Toggle
          label="Show child-page sub-navigation"
          checked={Boolean(page.showChildNavigation)}
          onChange={(checked) => setField("showChildNavigation", checked)}
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
      <div className="mt-4 rounded-xl border border-vb-purple/20 bg-vb-purple/[0.05] p-3 font-body text-xs leading-relaxed text-vb-silver/55">
        {parent
          ? `This is a child page of ${parent.title}. Its local path is ${page.path || `/${page.slug}`}. Keep the two main navigation toggles off to hide it from global header and footer links.`
          : childPages.length
            ? `${childPages.length} child ${childPages.length === 1 ? "page is" : "pages are"} connected here. Turn on “Show child-page sub-navigation” to display a local menu on this page and its children.`
            : "Create child pages by selecting this page as their Parent page. Their URL will automatically nest beneath this page."}
      </div>
    </section>
  );
}

function SectionEditor({
  section,
  preview,
  fourthwall,
  socials,
  pageLayout,
  pageLayoutPreview,
  onPageLayoutChange,
  onFourthwallChange,
  onChange,
  onDelete,
  onDuplicate,
  onMove,
}: {
  section: PageSection;
  preview?: PageSection;
  fourthwall: SiteSettings["fourthwall"];
  socials: SocialLink[];
  pageLayout?: PageLayout;
  pageLayoutPreview?: PageLayout;
  onPageLayoutChange: (patch: Partial<PageLayout>) => void;
  onFourthwallChange: (patch: Partial<SiteSettings["fourthwall"]>) => void;
  onChange: (patch: Partial<PageSection>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
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
  const [activeTab, setActiveTab] = useState<"content" | "style" | "advanced">("content");
  const sectionLabel =
    SECTION_TYPES.find((candidate) => candidate.type === section.type)?.label || section.type;
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
            aria-label="Duplicate section"
            onClick={onDuplicate}
            className="rounded p-1.5 text-vb-silver/60 hover:bg-vb-purple/10 hover:text-vb-purple-bright"
          >
            <Copy size={16} />
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
      <div className="mb-4 grid grid-cols-3 rounded-xl border border-white/[0.08] bg-vb-black/60 p-1" role="tablist" aria-label={`${sectionLabel} settings`}>
        {(["content", "style", "advanced"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-3 py-2 font-sub text-[11px] uppercase tracking-[0.16em] transition ${activeTab === tab ? "bg-vb-purple/25 text-vb-purple-bright" : "text-vb-silver/45 hover:text-vb-silver"}`}
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === "content" && (
        <div role="tabpanel" className="space-y-3">
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
                <RichTextArea
                  label="Text content"
                  value={section.body || ""}
                  formatted={section.bodyFormat === "inline"}
                  placeholder="Write the supporting copy visitors will see."
                  onChange={(value) => onChange({ body: value })}
                  onFormat={() => onChange({ bodyFormat: "inline" })}
                />
              )}
              {supportsMedia && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ImageAssetField
                    label={section.type === "video" ? "Poster image" : "Section image"}
                    value={section.imageUrl || ""}
                    previewUrl={preview?.imageUrl}
                    hint="Recommended 1200 × 675 px (16:9). JPG, PNG, WebP, GIF, or AVIF up to 10 MB."
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
              {section.type === "pressKit" && (
                <PressKitEditor
                  value={section.pressKit || { metrics: [], audience: {} }}
                  socials={socials}
                  onChange={(pressKit) => onChange({ pressKit })}
                />
              )}
              {section.type === "merch" && (
                <div className="mt-3 rounded-xl border border-vb-purple/20 bg-vb-purple/[0.05] p-3">
                  <div className="mb-3">
                    <h3 className="font-sub text-sm uppercase tracking-wide text-vb-purple-bright">
                      Merch store settings
                    </h3>
                    <p className="mt-1 font-body text-xs text-vb-silver/45">
                      These settings apply to this Merch page and its Fourthwall product feed.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field
                      label="Shop domain"
                      value={fourthwall.shopDomain}
                      placeholder="your-shop.fourthwall.com"
                      onChange={(value) =>
                        onFourthwallChange({ shopDomain: value.replace(/^https?:\/\//, "") })
                      }
                    />
                    <Field
                      label="Collection"
                      value={section.collection || fourthwall.defaultCollection}
                      hint="Use all for every product."
                      onChange={(value) => {
                        onChange({ collection: value });
                        onFourthwallChange({ defaultCollection: value });
                      }}
                    />
                    <Field
                      label="Currency"
                      value={fourthwall.currency}
                      placeholder="USD"
                      onChange={(value) => onFourthwallChange({ currency: value.toUpperCase().slice(0, 3) })}
                    />
                  </div>
                </div>
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
        </div>
      )}
      {activeTab === "style" && (
        <div role="tabpanel">
          <StyleWorkspace
            layout={layout}
            pageLayout={pageLayout}
            pageLayoutPreview={pageLayoutPreview}
            onChange={updateLayout}
            onPageLayoutChange={onPageLayoutChange}
          />
        </div>
      )}
      {activeTab === "advanced" && (
        <div role="tabpanel" className="space-y-3">
          <div className="rounded-lg border border-vb-purple/20 bg-vb-purple/[0.06] px-3 py-2 font-body text-xs text-vb-silver/55">
            Advanced hooks are optional. Use them for deep links, custom CSS hooks, and accessible section labels.
          </div>
          <Field label="Anchor ID" value={section.anchorId || ""} placeholder="e.g. licensing" hint="Letters, numbers, hyphens, and underscores only." onChange={(value) => onChange({ anchorId: value || undefined })} />
          <Field label="Custom CSS class" value={section.customClass || ""} placeholder="e.g. artist-intro" hint="Add a class supported by your site stylesheet." onChange={(value) => onChange({ customClass: value || undefined })} />
          <Field label="Accessibility label" value={section.ariaLabel || ""} placeholder={`${sectionLabel} section`} hint="Adds an accessible label to the section landmark." onChange={(value) => onChange({ ariaLabel: value || undefined })} />
        </div>
      )}
    </article>
  );
}

function ImageAssetField({
  label,
  hint,
  value,
  previewUrl,
  folder = "site-builder/images",
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  previewUrl?: string;
  folder?: string;
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
        folder={folder}
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

function PressKitEditor({
  value,
  socials,
  onChange,
}: {
  value: PressKitData;
  socials: SocialLink[];
  onChange: (value: PressKitData) => void;
}) {
  const metrics = value.metrics || [];
  const audience = value.audience || {};
  const updateMetric = (index: number, patch: Partial<PressKitMetric>) =>
    onChange({
      ...value,
      metrics: metrics.map((metric, metricIndex) =>
        metricIndex === index ? { ...metric, ...patch } : metric,
      ),
    });
  const updateBreakdown = (
    key: "gender" | "age" | "locations",
    index: number,
    patch: Partial<PressKitBreakdown>,
  ) => {
    const rows = audience[key] || [];
    onChange({
      ...value,
      audience: {
        ...audience,
        [key]: rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
      },
    });
  };
  const addBreakdown = (key: "gender" | "age" | "locations") =>
    onChange({
      ...value,
      audience: {
        ...audience,
        [key]: [...(audience[key] || []), { label: "New segment", value: 0 }],
      },
    });
  const removeBreakdown = (key: "gender" | "age" | "locations", index: number) =>
    onChange({
      ...value,
      audience: {
        ...audience,
        [key]: (audience[key] || []).filter((_, rowIndex) => rowIndex !== index),
      },
    });
  return (
    <div className="mt-3 space-y-4 rounded-xl border border-vb-purple/20 bg-vb-purple/[0.05] p-3">
      <div>
        <h3 className="font-sub text-sm uppercase tracking-wide text-vb-purple-bright">Press Kit analytics</h3>
        <p className="mt-1 font-body text-xs text-vb-silver/45">
          Enter verified figures from each platform. The block presents a polished snapshot for press, booking, and partnership inquiries.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Last updated"
          value={value.updatedAt || ""}
          placeholder="August 2026"
          onChange={(updatedAt) => onChange({ ...value, updatedAt })}
        />
        <Field
          label="Source note"
          value={value.sourceNote || ""}
          placeholder="Platform analytics, last 28 days"
          onChange={(sourceNote) => onChange({ ...value, sourceNote })}
        />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-sub text-xs uppercase tracking-wide text-vb-silver/70">Platforms</h4>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,
                metrics: [
                  ...metrics,
                  { id: newId("metric"), platform: "youtube", label: "YouTube" },
                ],
              })
            }
            className="inline-flex items-center gap-1 rounded border border-vb-purple/40 px-2 py-1 font-sub text-xs uppercase tracking-wide text-vb-purple-bright hover:bg-vb-purple/10"
          >
            <Plus size={13} /> Add platform
          </button>
        </div>
        {metrics.length === 0 && (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-3 font-body text-xs text-vb-silver/40">
            Add YouTube, TikTok, Instagram, Facebook, Spotify, or another platform to begin.
          </p>
        )}
        {metrics.map((metric, index) => {
          const linkedSocial = socials.find((social) => social.id === metric.socialId);
          return (
          <div key={metric.id} className="rounded-lg border border-white/[0.08] bg-vb-black/40 p-3">
            <div className="mb-3 flex items-end gap-2">
              <label className="block min-w-0 flex-1 font-body text-xs uppercase tracking-wider text-vb-silver/50">
                Linked social profile
                <select
                  aria-label={`Linked social profile ${index + 1}`}
                  value={metric.socialId || "manual"}
                  onChange={(event) => {
                    const social = socials.find((candidate) => candidate.id === event.target.value);
                    updateMetric(index, social
                      ? { socialId: social.id, platform: social.platform === "custom" ? "other" : social.platform, label: social.label, url: social.url }
                      : { socialId: undefined });
                  }}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-vb-black px-3 py-2.5 font-body text-sm normal-case tracking-normal text-vb-silver-bright outline-none focus:border-vb-purple-bright/60"
                >
                  <option value="manual">Manual profile details</option>
                  {socials.map((social) => (
                    <option key={social.id} value={social.id}>{social.label} · {social.url}</option>
                  ))}
                </select>
              </label>
              <label className="block min-w-0 flex-1 font-body text-xs uppercase tracking-wider text-vb-silver/50">
                Platform
                <select
                  aria-label={`Platform ${index + 1}`}
                  value={metric.platform}
                  onChange={(event) => updateMetric(index, { platform: event.target.value as PressKitPlatform })}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-vb-black px-3 py-2.5 font-body text-sm normal-case tracking-normal text-vb-silver-bright outline-none focus:border-vb-purple-bright/60"
                >
                  {PRESS_KIT_PLATFORMS.map((platform) => (
                    <option key={platform.value} value={platform.value}>{platform.label}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                aria-label={`Remove platform ${index + 1}`}
                onClick={() => onChange({ ...value, metrics: metrics.filter((_, metricIndex) => metricIndex !== index) })}
                className="h-10 rounded-lg px-2 text-vb-silver/40 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Display label" value={metric.label || ""} placeholder="Official channel" disabled={Boolean(linkedSocial)} onChange={(label) => updateMetric(index, { label })} />
              <Field label="Handle or account" value={metric.handle || ""} placeholder="@vylanous" onChange={(handle) => updateMetric(index, { handle })} />
              <NumberField label="Followers" value={metric.followers} onChange={(followers) => updateMetric(index, { followers })} />
              <NumberField label="Subscribers" value={metric.subscribers} onChange={(subscribers) => updateMetric(index, { subscribers })} />
              <NumberField label="Videos uploaded" value={metric.videos} onChange={(videos) => updateMetric(index, { videos })} />
              <NumberField label="Posts uploaded" value={metric.posts} onChange={(posts) => updateMetric(index, { posts })} />
              <NumberField label="Total views" value={metric.views} onChange={(views) => updateMetric(index, { views })} />
              <NumberField label="Likes" value={metric.likes} onChange={(likes) => updateMetric(index, { likes })} />
              <NumberField label="Engagement rate %" value={metric.engagementRate} onChange={(engagementRate) => updateMetric(index, { engagementRate })} />
              <Field label="Profile URL" value={metric.url || ""} placeholder="https://…" disabled={Boolean(linkedSocial)} onChange={(url) => updateMetric(index, { url })} />
            </div>
          </div>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {(["gender", "age", "locations"] as const).map((key) => {
          const rows = audience[key] || [];
          const label = key === "gender" ? "Gender" : key === "age" ? "Age groups" : "Top locations";
          return (
            <div key={key} className="rounded-lg border border-white/[0.08] bg-vb-black/40 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="font-sub text-xs uppercase tracking-wide text-vb-silver/70">{label}</h4>
                <button type="button" onClick={() => addBreakdown(key)} className="rounded border border-white/10 px-2 py-1 font-sub text-[10px] uppercase text-vb-purple-bright hover:bg-vb-purple/10">Add</button>
              </div>
              <div className="space-y-2">
                {rows.map((row, index) => (
                  <div key={`${key}-${index}`} className="flex items-center gap-2">
                    <input aria-label={`${label} segment ${index + 1}`} value={row.label} onChange={(event) => updateBreakdown(key, index, { label: event.target.value })} className="min-w-0 flex-1 rounded border border-white/10 bg-vb-black px-2 py-2 font-body text-xs text-vb-silver-bright outline-none focus:border-vb-purple-bright/60" />
                    <input aria-label={`${label} percentage ${index + 1}`} type="number" min="0" max="100" step="0.1" value={row.value} onChange={(event) => updateBreakdown(key, index, { value: Number(event.target.value) || 0 })} className="w-20 rounded border border-white/10 bg-vb-black px-2 py-2 font-body text-xs text-vb-silver-bright outline-none focus:border-vb-purple-bright/60" />
                    <span className="font-body text-xs text-vb-silver/40">%</span>
                    <button type="button" aria-label={`Remove ${label} segment ${index + 1}`} onClick={() => removeBreakdown(key, index)} className="text-vb-silver/35 hover:text-red-400"><Trash2 size={13} /></button>
                  </div>
                ))}
                {rows.length === 0 && <p className="font-body text-xs text-vb-silver/35">No data added.</p>}
              </div>
            </div>
          );
        })}
      </div>
      <Textarea
        label="Audience note"
        value={audience.note || ""}
        placeholder="Optional context about the reporting period or methodology."
        onChange={(note) => onChange({ ...value, audience: { ...audience, note } })}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <label className="block font-body text-xs uppercase tracking-wider text-vb-silver/50">
      {label}
      <input
        aria-label={label}
        type="number"
        min="0"
        step="any"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
        className="mt-1.5 w-full rounded-lg border border-white/10 bg-vb-black px-3 py-2.5 font-body text-sm normal-case tracking-normal text-vb-silver-bright outline-none focus:border-vb-purple-bright/60"
      />
    </label>
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
          {items.map((item, index) => {
            const updateItem = (patch: Partial<SectionItem>) =>
              onChange(
                items.map((candidate, candidateIndex) =>
                  candidateIndex === index ? { ...candidate, ...patch } : candidate,
                ),
              );
            return (
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
              <Field
                label="Title"
                value={item.title}
                onChange={(title) => updateItem({ title })}
              />
              <Textarea
                label="Description"
                value={item.body || ""}
                onChange={(body) => updateItem({ body })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Button label"
                  value={item.label || ""}
                  onChange={(labelValue) => updateItem({ label: labelValue })}
                />
                <Field
                  label="Link URL"
                  value={item.href || ""}
                  placeholder="https://… or /page"
                  onChange={(href) => updateItem({ href })}
                />
              </div>
              <FileUpload
                label={`${label.replace(/s$/, "")} ${index + 1} image`}
                hint="Recommended 1200 × 675 px (16:9). JPG, PNG, WebP, GIF, or AVIF up to 10 MB."
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                folder="site-builder/images"
                kind="image"
                maxBytes={10 * 1024 * 1024}
                value={item.imageUrl || ""}
                previewUrl={previewItems.find((candidate) => candidate.id === item.id)?.imageUrl}
                onChange={(imageUrl) => updateItem({ imageUrl })}
              />
            </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 font-body text-xs text-vb-silver/40">
        Edit each card above using labeled fields. Changes preview as you work and save with the
        site design button.
      </p>
    </div>
  );
}

function StyleWorkspace({
  layout,
  pageLayout,
  pageLayoutPreview,
  onChange,
  onPageLayoutChange,
}: {
  layout: Required<SectionLayout>;
  pageLayout?: PageLayout;
  pageLayoutPreview?: PageLayout;
  onChange: (patch: Partial<SectionLayout>) => void;
  onPageLayoutChange: (patch: Partial<PageLayout>) => void;
}) {
  const page = pageLayout || {};
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-vb-purple/30 bg-gradient-to-br from-vb-purple/[0.14] to-transparent p-4">
        <p className="font-sub text-xs uppercase tracking-[0.2em] text-vb-purple-bright">Visual style studio</p>
        <h3 className="mt-1 font-display text-2xl uppercase text-chrome">Make this page yours</h3>
        <p className="mt-1 max-w-2xl font-body text-xs leading-relaxed text-vb-silver/55">
          Start with the page colors, then refine this section’s layout. Every control below updates the live preview as you work.
        </p>
      </div>
      <StyleGroup title="Page colors" description="These colors control the page itself—not just one section.">
        <div className="grid gap-3 sm:grid-cols-2">
          <ColorControl label="Main brand color" value={page.primaryColor || "#7C2FCB"} onChange={(value) => onPageLayoutChange({ primaryColor: value })} hint="Buttons, active states, highlights, and linked chrome." />
          <ColorControl label="Page background" value={page.backgroundColor || "#0B0A0F"} onChange={(value) => onPageLayoutChange({ backgroundColor: value })} hint="The actual page canvas behind your sections." />
          <ColorControl label="Eyebrow text color" value={page.eyebrowColor || page.primaryColor || "#B56CFF"} onChange={(value) => onPageLayoutChange({ eyebrowColor: value })} hint="Small uppercase labels above headlines." />
          <ColorControl label="Link and hover color" value={page.linkColor || page.primaryColor || "#B56CFF"} onChange={(value) => onPageLayoutChange({ linkColor: value })} hint="Links, social actions, and hover emphasis." />
        </div>
        <button type="button" onClick={() => onPageLayoutChange({ primaryColor: "", backgroundColor: "", eyebrowColor: "", linkColor: "" })} className="mt-3 font-sub text-[11px] uppercase tracking-wide text-vb-muted hover:text-vb-purple-bright">Reset page colors</button>
      </StyleGroup>
      <StyleGroup title="Page background image" description="Upload a full-page image, then tune how it sits behind your page content.">
        <ImageAssetField
          label="Background image"
          hint="Recommended: 2560 × 1440 px or larger. Use a dark, high-contrast image so text stays readable."
          value={page.backgroundImage || ""}
          previewUrl={pageLayoutPreview?.backgroundImage}
          folder="site-builder/backgrounds"
          onChange={(backgroundImage) => onPageLayoutChange({ backgroundImage })}
        />
        {page.backgroundImage ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SelectField label="Image fit" value={page.backgroundImageFit || "cover"} options={["cover", "contain", "tile"]} onChange={(value) => onPageLayoutChange({ backgroundImageFit: value as NonNullable<PageLayout["backgroundImageFit"]> })} />
            <SelectField label="Image position" value={page.backgroundImagePosition || "center"} options={["center", "top", "bottom", "left", "right"]} onChange={(value) => onPageLayoutChange({ backgroundImagePosition: value as NonNullable<PageLayout["backgroundImagePosition"]> })} />
            <SelectField label="Readability overlay" value={page.backgroundOverlay || "medium"} options={["none", "soft", "medium", "strong"]} onChange={(value) => onPageLayoutChange({ backgroundOverlay: value as NonNullable<PageLayout["backgroundOverlay"]> })} />
            <SelectField label="Page texture" value={page.pageTreatment || "none"} options={["none", "grain", "grid", "spotlight"]} onChange={(value) => onPageLayoutChange({ pageTreatment: value as NonNullable<PageLayout["pageTreatment"]> })} />
          </div>
        ) : (
          <p className="mt-3 font-body text-xs text-vb-silver/40">Your selected page background color remains visible until an image is uploaded.</p>
        )}
        <button type="button" onClick={() => onPageLayoutChange({ backgroundImage: "", backgroundImageFit: "cover", backgroundImagePosition: "center", backgroundOverlay: "medium", pageTreatment: "none" })} className="mt-3 font-sub text-[11px] uppercase tracking-wide text-vb-muted hover:text-vb-purple-bright">Remove background treatment</button>
      </StyleGroup>
      <StyleGroup title="Page-wide defaults" description="Optionally apply one font, content width, and vertical rhythm to every section on this page.">
        <div className="grid gap-3 sm:grid-cols-2">
          <PageFontPicker value={page.pageFont} onChange={(pageFont) => onPageLayoutChange({ pageFont })} />
          <SelectField label="Content width" value={page.contentWidth || "block"} options={["block", "narrow", "standard", "wide", "full"]} onChange={(value) => onPageLayoutChange({ contentWidth: value === "block" ? undefined : value as NonNullable<PageLayout["contentWidth"]> })} />
          <SelectField label="Section spacing" value={page.sectionSpacing || "block"} options={["block", "tight", "normal", "relaxed", "cinematic"]} onChange={(value) => onPageLayoutChange({ sectionSpacing: value === "block" ? undefined : value as NonNullable<PageLayout["sectionSpacing"]> })} />
        </div>
        <p className="mt-2 font-body text-xs text-vb-silver/40">Choose “block” to keep each section’s individual font, width, or spacing choice.</p>
      </StyleGroup>
      <StyleGroup title="Connect this page’s chrome" description="Choose which global areas inherit this page’s main color while visitors are on this page.">
        <div className="grid gap-2 sm:grid-cols-3">
          <ToggleCard label="Header" description="Logo actions and header accents" checked={Boolean(page.chrome?.header)} onChange={(checked) => onPageLayoutChange({ chrome: { ...page.chrome, header: checked } })} />
          <ToggleCard label="Navigation" description="Active links and menu accents" checked={Boolean(page.chrome?.navigation)} onChange={(checked) => onPageLayoutChange({ chrome: { ...page.chrome, navigation: checked } })} />
          <ToggleCard label="Footer" description="Footer links and signup accents" checked={Boolean(page.chrome?.footer)} onChange={(checked) => onPageLayoutChange({ chrome: { ...page.chrome, footer: checked } })} />
        </div>
      </StyleGroup>
      <StyleGroup title="Section appearance" description="Choose separate heading and body fonts, direct text sizes, color treatment, and alignment.">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Color mood" value={layout.palette} options={["brand", "mono", "electric", "sunset", "forest"]} onChange={(value) => onChange({ palette: value as Required<SectionLayout>["palette"] })} />
          <FontLibraryPicker label="Heading font" value={layout.fontFamily} onChange={(fontFamily) => onChange({ fontFamily })} />
          <FontLibraryPicker label="Body font" value={layout.bodyFontFamily} onChange={(bodyFontFamily) => onChange({ bodyFontFamily })} />
          <SelectField label="Eyebrow text size" value={layout.eyebrowSize} options={["12px", "14px", "16px", "18px", "20px"]} onChange={(value) => onChange({ eyebrowSize: value as Required<SectionLayout>["eyebrowSize"] })} />
          <SelectField label="Heading text size" value={layout.headingSize} options={["32px", "40px", "48px", "56px", "64px", "72px", "88px", "104px"]} onChange={(value) => onChange({ headingSize: value as Required<SectionLayout>["headingSize"] })} />
          <SelectField label="Body text size" value={layout.bodySize} options={["14px", "16px", "18px", "20px", "22px", "24px"]} onChange={(value) => onChange({ bodySize: value as Required<SectionLayout>["bodySize"] })} />
          <SelectField label="Section background" value={layout.surface} options={["transparent", "ink", "mesh", "accent", "bordered"]} onChange={(value) => onChange({ surface: value as Required<SectionLayout>["surface"] })} />
          <SelectField label="Text alignment" value={layout.alignment} options={["left", "center", "right"]} onChange={(value) => onChange({ alignment: value as Required<SectionLayout>["alignment"] })} />
        </div>
        <ColorControl label="Section accent override" value={layout.customColor || page.primaryColor || "#7C2FCB"} onChange={(value) => onChange({ customColor: value })} hint="Optional: use this only when this section needs a different accent." />
      </StyleGroup>
      <StyleGroup title="Spacing and finish" description="Control how much room the section gets and how polished its container feels.">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Content width" value={layout.width} options={["narrow", "standard", "wide", "full"]} onChange={(value) => onChange({ width: value as Required<SectionLayout>["width"] })} />
          <SelectField label="Section spacing" value={layout.spacing} options={["tight", "normal", "relaxed", "cinematic"]} onChange={(value) => onChange({ spacing: value as Required<SectionLayout>["spacing"] })} />
          <SelectField label="Horizontal padding" value={layout.paddingX} options={["none", "tight", "normal", "wide"]} onChange={(value) => onChange({ paddingX: value as Required<SectionLayout>["paddingX"] })} />
          <SelectField label="Shadow" value={layout.shadow} options={["none", "soft", "glow", "dramatic"]} onChange={(value) => onChange({ shadow: value as Required<SectionLayout>["shadow"] })} />
          <SelectField label="Border" value={layout.borderStyle} options={["none", "subtle", "accent", "chrome"]} onChange={(value) => onChange({ borderStyle: value as Required<SectionLayout>["borderStyle"] })} />
          <SelectField label="Corner style" value={layout.borderRadius} options={["none", "soft", "rounded"]} onChange={(value) => onChange({ borderRadius: value as Required<SectionLayout>["borderRadius"] })} />
        </div>
      </StyleGroup>
      <details className="rounded-xl border border-white/[0.08] bg-vb-black/30 p-4">
        <summary className="cursor-pointer font-sub text-xs uppercase tracking-[0.16em] text-vb-silver/60 hover:text-vb-purple-bright">Optional media and grid controls</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SelectField label="Column count" value={String(layout.columns)} options={["1", "2", "3", "4"]} onChange={(value) => onChange({ columns: Number(value) as 1 | 2 | 3 | 4 })} />
          <SelectField label="Media placement" value={layout.mediaPosition} options={["none", "left", "right", "background", "top"]} onChange={(value) => onChange({ mediaPosition: value as Required<SectionLayout>["mediaPosition"] })} />
          <SelectField label="Media fit" value={layout.mediaFit} options={["cover", "contain"]} onChange={(value) => onChange({ mediaFit: value as Required<SectionLayout>["mediaFit"] })} />
          <SelectField label="Media shape" value={layout.mediaAspect} options={["auto", "square", "wide", "portrait", "cinema"]} onChange={(value) => onChange({ mediaAspect: value as Required<SectionLayout>["mediaAspect"] })} />
        </div>
      </details>
    </div>
  );
}

function StyleGroup({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-white/[0.08] bg-vb-black/35 p-4"><div className="mb-4"><h4 className="font-sub text-sm uppercase tracking-[0.14em] text-vb-silver/85">{title}</h4><p className="mt-1 font-body text-xs leading-relaxed text-vb-silver/45">{description}</p></div>{children}</section>;
}

function ColorControl({ label, value, hint, onChange }: { label: string; value: string; hint: string; onChange: (value: string) => void }) {
  return <label className="block font-body text-xs uppercase tracking-wider text-vb-silver/60">{label}<span className="mt-1 block normal-case tracking-normal text-vb-silver/35">{hint}</span><div className="mt-2 flex items-center gap-2"><input type="color" aria-label={`${label} color picker`} value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#7C2FCB"} onChange={(event) => onChange(event.currentTarget.value.toUpperCase())} className="h-10 w-12 cursor-pointer rounded-md border border-white/15 bg-transparent p-1" /><input type="text" aria-label={`${label} hex value`} value={value} maxLength={7} onChange={(event) => { const next = event.currentTarget.value.toUpperCase(); if (next === "" || /^#[0-9A-F]{0,6}$/.test(next)) onChange(next); }} className="h-10 min-w-0 flex-1 rounded-md border border-white/15 bg-vb-black/50 px-3 font-mono text-sm text-vb-silver-bright outline-none focus:border-vb-purple-bright" /></div></label>;
}

function FontLibraryPicker({
  label = "Font family",
  value,
  onChange,
}: {
  label?: string;
  value: Required<SectionLayout>["fontFamily"];
  onChange: (value: Required<SectionLayout>["fontFamily"]) => void;
}) {
  const selected = BUILDER_FONT_OPTIONS.find((font) => font.id === value) || BUILDER_FONT_OPTIONS[0];
  return (
    <label className="block font-body text-xs uppercase tracking-wider text-vb-silver/60">
      {label}
      <span className="mt-1 block normal-case tracking-normal text-vb-silver/35">
        Choose from 50 practical display, sans, serif, and mono fonts.
      </span>
      <select
        aria-label="Font family"
        value={selected.id}
        onChange={(event) => onChange(event.target.value as Required<SectionLayout>["fontFamily"])}
        style={{ fontFamily: selected.family }}
        className="mt-2 w-full rounded-lg border border-white/10 bg-vb-black/50 px-3 py-2.5 text-base normal-case tracking-normal text-vb-silver-bright outline-none focus:border-vb-purple-bright"
      >
        {BUILDER_FONT_OPTIONS.map((font) => (
          <option key={font.id} value={font.id} style={{ fontFamily: font.family }}>
            {font.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PageFontPicker({
  value,
  onChange,
}: {
  value?: PageLayout["pageFont"];
  onChange: (value: PageLayout["pageFont"] | undefined) => void;
}) {
  const selected = value ? BUILDER_FONT_OPTIONS.find((font) => font.id === value) : undefined;
  return (
    <label className="block font-body text-xs uppercase tracking-wider text-vb-silver/60">
      Page font override
      <span className="mt-1 block normal-case tracking-normal text-vb-silver/35">Set one font for every section, or preserve each block’s own choice.</span>
      <select aria-label="Page font override" value={value || "block"} onChange={(event) => onChange(event.target.value === "block" ? undefined : event.target.value as PageLayout["pageFont"])} style={{ fontFamily: selected?.family }} className="mt-2 w-full rounded-lg border border-white/10 bg-vb-black/50 px-3 py-2.5 text-base normal-case tracking-normal text-vb-silver-bright outline-none focus:border-vb-purple-bright">
        <option value="block">Use each block’s font</option>
        {BUILDER_FONT_OPTIONS.map((font) => <option key={font.id} value={font.id} style={{ fontFamily: font.family }}>{font.label}</option>)}
      </select>
    </label>
  );
}

function ToggleCard({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className={`cursor-pointer rounded-lg border p-3 transition ${checked ? "border-vb-purple/60 bg-vb-purple/10" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"}`}><input aria-label={`Link ${label} styling to this page`} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" /><span className="flex items-center justify-between gap-2 font-sub text-xs uppercase tracking-wide text-vb-silver-bright"><span>{label}</span><span className={`h-2 w-2 rounded-full ${checked ? "bg-vb-purple-bright" : "bg-white/20"}`} /></span><span className="mt-1 block font-body text-[11px] leading-relaxed text-vb-silver/40">{description}</span></label>;
}

void LayoutControls;

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
          label="Color palette"
          value={layout.palette}
          options={["brand", "mono", "electric", "sunset", "forest"]}
          onChange={(value) => onChange({ palette: value as Required<SectionLayout>["palette"] })}
        />
        <SelectField
          label="Font family"
          value={layout.fontFamily}
          options={BUILDER_FONT_OPTIONS.map((font) => font.id)}
          onChange={(value) =>
            onChange({ fontFamily: value as Required<SectionLayout>["fontFamily"] })
          }
        />
        <div className="space-y-1.5">
          <span className="font-sub text-xs uppercase tracking-wide text-vb-silver/70">
            Custom accent color
          </span>
          <div className="flex items-center gap-2">
            <input
              id="builder-custom-accent-color"
              type="color"
              aria-label="Choose custom accent color"
              value={layout.customColor || "#7c2fcb"}
              onChange={(event) => onChange({ customColor: event.currentTarget.value.toUpperCase() })}
              className="h-10 w-12 cursor-pointer rounded-md border border-white/15 bg-transparent p-1"
            />
            <input
              id="builder-custom-accent-hex"
              type="text"
              aria-label="Custom accent color hex value"
              value={layout.customColor}
              placeholder="#7C2FCB"
              maxLength={7}
              onChange={(event) => {
                const value = event.currentTarget.value.toUpperCase();
                if (value === "" || /^#[0-9A-F]{0,6}$/.test(value)) onChange({ customColor: value });
              }}
              className="h-10 min-w-0 flex-1 rounded-md border border-white/15 bg-vb-black/40 px-3 font-mono text-sm text-vb-silver-bright outline-none transition focus:border-vb-purple-bright focus:ring-2 focus:ring-vb-purple/30"
            />
            {layout.customColor && (
              <button
                type="button"
                onClick={() => onChange({ customColor: "" })}
                className="font-sub text-[11px] uppercase tracking-wide text-vb-muted hover:text-vb-purple-bright"
              >
                Reset
              </button>
            )}
          </div>
          <p className="font-body text-[11px] text-vb-muted">
            Overrides the selected palette accent for this section.
          </p>
        </div>
        <SelectField
          label="Heading scale"
          value={layout.headingScale}
          options={["compact", "standard", "display", "hero"]}
          onChange={(value) =>
            onChange({ headingScale: value as Required<SectionLayout>["headingScale"] })
          }
        />
        <SelectField
          label="Horizontal padding"
          value={layout.paddingX}
          options={["none", "tight", "normal", "wide"]}
          onChange={(value) => onChange({ paddingX: value as Required<SectionLayout>["paddingX"] })}
        />
        <SelectField
          label="Shadow effect"
          value={layout.shadow}
          options={["none", "soft", "glow", "dramatic"]}
          onChange={(value) => onChange({ shadow: value as Required<SectionLayout>["shadow"] })}
        />
        <SelectField
          label="Border treatment"
          value={layout.borderStyle}
          options={["none", "subtle", "accent", "chrome"]}
          onChange={(value) =>
            onChange({ borderStyle: value as Required<SectionLayout>["borderStyle"] })
          }
        />
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

function RichTextArea({
  label,
  value,
  formatted,
  onChange,
  onFormat,
  placeholder,
}: {
  label: string;
  value: string;
  formatted: boolean;
  onChange: (value: string) => void;
  onFormat: () => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wrapSelection = (open: string, close = open) => {
    const input = inputRef.current;
    if (!input || input.selectionStart === input.selectionEnd) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = value.slice(start, end);
    onChange(`${value.slice(0, start)}${open}${selected}${close}${value.slice(end)}`);
    onFormat();
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + open.length, end + open.length);
    });
  };
  const controls = [
    { label: "Bold selected text", icon: Bold, apply: () => wrapSelection("**") },
    { label: "Italicize selected text", icon: Italic, apply: () => wrapSelection("_") },
    { label: "Underline selected text", icon: Underline, apply: () => wrapSelection("[u]", "[/u]") },
  ];
  return (
    <div className="mt-3">
      <div className="flex items-end justify-between gap-3">
        <label htmlFor="builder-rich-text-content" className="font-body text-xs uppercase tracking-wider text-vb-silver/50">{label}</label>
        <div className="flex items-center gap-1 rounded-md border border-white/10 bg-vb-black/60 p-1" aria-label="Text formatting controls">
          {controls.map(({ label: controlLabel, icon: Icon, apply }) => (
            <button key={controlLabel} type="button" aria-label={controlLabel} title={controlLabel} onMouseDown={(event) => event.preventDefault()} onClick={apply} className="grid h-7 w-7 place-items-center rounded text-vb-silver/60 transition hover:bg-vb-purple/20 hover:text-vb-purple-bright focus:outline-none focus:ring-2 focus:ring-vb-purple-bright/60">
              <Icon size={14} strokeWidth={2.4} />
            </button>
          ))}
        </div>
      </div>
      <textarea ref={inputRef} id="builder-rich-text-content" aria-label={label} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} rows={5} className="mt-1.5 w-full rounded-lg border border-white/10 bg-vb-black px-3 py-2.5 font-body text-sm normal-case tracking-normal text-vb-silver-bright outline-none placeholder:text-vb-silver/25 focus:border-vb-purple-bright/60" />
      <p className="mt-1.5 font-body text-[11px] leading-relaxed text-vb-silver/40">Select words in your copy, then use the controls above. Bold, italic, and underline work across published Builder pages{formatted ? "." : " once applied."}</p>
      <div aria-live="polite" aria-label="Live formatted text preview" className="mt-3 rounded-lg border border-vb-purple/25 bg-vb-purple/[0.07] p-3">
        <p className="font-sub text-[10px] uppercase tracking-[0.18em] text-vb-purple-bright">Live preview</p>
        <p className="mt-1 whitespace-pre-wrap font-body text-sm leading-relaxed text-vb-silver-bright">
          {value ? <FormattedText value={value} formatted={formatted} /> : <span className="text-vb-silver/40">Formatted copy will appear here as you type.</span>}
        </p>
      </div>
    </div>
  );
}

function FormattedText({ value, formatted }: { value: string; formatted: boolean }) {
  if (!formatted) return value;
  return parseInlineText(value).map((token, index) => {
    if (token.style === "bold") return <strong key={index}>{token.text}</strong>;
    if (token.style === "italic") return <em key={index}>{token.text}</em>;
    if (token.style === "underline") return <u key={index}>{token.text}</u>;
    return <span key={index}>{token.text}</span>;
  });
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
