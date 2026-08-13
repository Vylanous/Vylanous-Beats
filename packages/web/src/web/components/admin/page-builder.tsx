/**
 * Vylanous Page Builder visual system: dark industrial surfaces, chrome display type,
 * and a purple accent. Keep editing controls compact, direct, and music-first.
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
import type {
  BuilderPage,
  PageSection,
  PageSectionType,
  SiteSettings,
} from "../../../shared/site-settings";

const SECTION_TYPES: PageSectionType[] = ["hero", "text", "image", "pressKit", "merch"];

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function blankSection(type: PageSectionType): PageSection {
  return {
    id: newId("section"),
    type,
    title: type === "merch" ? "Latest Drop" : "New section",
    body: "",
    collection: type === "merch" ? "all" : undefined,
  };
}

function blankPage(): BuilderPage {
  return {
    id: newId("page"),
    slug: "new-page",
    title: "New Page",
    navLabel: "New Page",
    published: false,
    showInNav: false,
    seo: { canonicalPath: "/new-page" },
    sections: [blankSection("hero")],
  };
}

export default function PageBuilderPanel() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getAdminSettings()
      .then(({ settings: loaded }) => {
        setSettings(loaded);
        setSelectedId(loaded.pages[0]?.id || "");
      })
      .catch(() => setNotice("Unable to load page settings."));
  }, []);

  const page = useMemo(
    () => settings?.pages.find((candidate) => candidate.id === selectedId) || settings?.pages[0],
    [selectedId, settings],
  );

  const updatePage = (next: BuilderPage) => {
    setSettings((current) =>
      current
        ? {
            ...current,
            pages: current.pages.map((candidate) => (candidate.id === next.id ? next : candidate)),
          }
        : current,
    );
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setNotice("");
    try {
      const result = await saveAdminSettings({
        pages: settings.pages,
        fourthwall: settings.fourthwall,
      });
      setSettings(result.settings);
      setNotice("Saved. Your live pages update immediately.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (!settings || !page)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="animate-spin text-vb-purple-bright" />
      </div>
    );

  const setField = <K extends keyof BuilderPage>(field: K, value: BuilderPage[K]) =>
    updatePage({ ...page, [field]: value });
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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wide text-chrome">
            Page Builder
          </h1>
          <p className="mt-1 font-body text-sm text-vb-silver/55">
            Create artist, EPK, merch, and campaign pages. Reorder sections to change the layout.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-vb-purple px-4 py-2.5 font-sub uppercase tracking-wide text-white transition hover:bg-vb-purple-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? "Saving" : "Save pages"}
        </button>
      </div>
      {notice && <p className="mb-4 font-body text-sm text-vb-purple-bright">{notice}</p>}
      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
          <div className="mb-2 px-2 font-sub text-xs uppercase tracking-[0.2em] text-vb-silver/45">
            Pages
          </div>
          <div className="space-y-1">
            {settings.pages.map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => setSelectedId(candidate.id)}
                className={`w-full rounded-lg px-3 py-2.5 text-left font-body text-sm transition ${page.id === candidate.id ? "bg-vb-purple/20 text-vb-silver-bright" : "text-vb-silver/65 hover:bg-white/[0.05]"}`}
              >
                <span className="block truncate">{candidate.title}</span>
                <span className="block text-xs opacity-55">/{candidate.slug}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              const next = blankPage();
              setSettings({ ...settings, pages: [...settings.pages, next] });
              setSelectedId(next.id);
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 px-3 py-2.5 font-sub text-sm uppercase tracking-wide text-vb-silver/70 transition hover:border-vb-purple/60 hover:text-vb-silver-bright"
          >
            <Plus size={15} /> Add page
          </button>
        </aside>
        <div className="space-y-5">
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
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
                label="URL slug"
                value={page.slug}
                onChange={(value) =>
                  setField("slug", value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                }
              />
              <div className="flex items-end gap-5 pb-2">
                <Toggle
                  label="Published"
                  checked={page.published}
                  onChange={(checked) => setField("published", checked)}
                />
                <Toggle
                  label="Show in navigation"
                  checked={page.showInNav}
                  onChange={(checked) => setField("showInNav", checked)}
                />
              </div>
            </div>
            {page.published && (
              <a
                href={`/${page.slug}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 font-sub text-sm uppercase tracking-wide text-vb-purple-bright hover:text-white"
              >
                Preview live page <Eye size={15} />
              </a>
            )}
          </section>
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-sub text-xl uppercase tracking-wide">Layout sections</h2>
                <p className="font-body text-sm text-vb-silver/50">
                  Use the arrows to change section order.
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
                {SECTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              {page.sections.map((section, index) => (
                <SectionEditor
                  key={section.id}
                  section={section}
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
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <h2 className="font-sub text-xl uppercase tracking-wide">Search & social sharing</h2>
            <p className="mt-1 font-body text-sm text-vb-silver/50">
              Set the title, description, canonical URL, and social-card image for this page.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="SEO title"
                value={page.seo?.title || ""}
                onChange={(value) => setField("seo", { ...page.seo, title: value })}
              />
              <Field
                label="Canonical path"
                value={page.seo?.canonicalPath || `/${page.slug}`}
                onChange={(value) =>
                  setField("seo", {
                    ...page.seo,
                    canonicalPath: value.startsWith("/") ? value : `/${value}`,
                  })
                }
              />
            </div>
            <label className="mt-4 block font-body text-xs uppercase tracking-wider text-vb-silver/50">
              Meta description
              <textarea
                aria-label="Meta description"
                value={page.seo?.description || ""}
                onChange={(event) =>
                  setField("seo", { ...page.seo, description: event.target.value.slice(0, 200) })
                }
                rows={3}
                maxLength={200}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-vb-black px-3 py-2.5 font-body text-sm text-vb-silver-bright outline-none focus:border-vb-purple-bright/60"
              />
              <span className="mt-1 block normal-case tracking-normal text-vb-silver/35">
                {(page.seo?.description || "").length}/200 characters
              </span>
            </label>
            <div className="mt-4">
              <Field
                label="Open Graph image URL"
                value={page.seo?.ogImageUrl || ""}
                onChange={(value) => setField("seo", { ...page.seo, ogImageUrl: value })}
              />
            </div>
            <div className="mt-4">
              <Toggle
                label="Keep this page out of search indexes"
                checked={Boolean(page.seo?.noIndex)}
                onChange={(checked) => setField("seo", { ...page.seo, noIndex: checked })}
              />
            </div>
          </section>
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <h2 className="font-sub text-xl uppercase tracking-wide">Fourthwall storefront</h2>
            <p className="mt-1 font-body text-sm text-vb-silver/50">
              Products are pulled securely from your existing Fourthwall shop after its token is
              configured on the server.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field
                label="Shop domain"
                value={settings.fourthwall.shopDomain}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    fourthwall: {
                      ...settings.fourthwall,
                      shopDomain: value.replace(/^https?:\/\//, ""),
                    },
                  })
                }
              />
              <Field
                label="Default collection"
                value={settings.fourthwall.defaultCollection}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    fourthwall: { ...settings.fourthwall, defaultCollection: value },
                  })
                }
              />
              <Field
                label="Currency"
                value={settings.fourthwall.currency}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    fourthwall: {
                      ...settings.fourthwall,
                      currency: value.toUpperCase().slice(0, 3),
                    },
                  })
                }
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  onChange,
  onDelete,
  onMove,
}: {
  section: PageSection;
  onChange: (patch: Partial<PageSection>) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const details: Record<PageSectionType, string> = {
    hero: "Set the headline, supporting copy, and optional button for this page's opening moment.",
    text: "Add a titled editorial section, with an optional button to direct visitors onward.",
    image: "Use a direct image URL. The description is used as accessible alt text for the visual.",
    pressKit:
      "Create a press or booking block with details and an optional download or contact button.",
    merch:
      "Introduce a Fourthwall product collection. Products and checkout are loaded automatically.",
  };

  return (
    <article className="rounded-xl border border-white/[0.08] bg-vb-black/50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GripVertical size={17} className="text-vb-silver/35" />
          <span className="font-sub uppercase tracking-wide text-vb-purple-bright">
            {section.type}
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
      <p className="-mt-1 mb-4 max-w-2xl font-body text-sm text-vb-silver/50">
        {details[section.type]}
      </p>

      {section.type === "hero" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Eyebrow"
              placeholder="New release"
              value={section.eyebrow || ""}
              onChange={(value) => onChange({ eyebrow: value })}
            />
            <Field
              label="Hero headline"
              placeholder="The sound moves different"
              value={section.title || ""}
              onChange={(value) => onChange({ title: value })}
            />
          </div>
          <SectionTextarea
            label="Supporting copy"
            placeholder="Add a short introduction below the hero headline."
            value={section.body || ""}
            onChange={(value) => onChange({ body: value })}
          />
          <CtaFields section={section} onChange={onChange} />
        </>
      )}

      {section.type === "text" && (
        <>
          <Field
            label="Section heading"
            placeholder="Built for the loudest rooms"
            value={section.title || ""}
            onChange={(value) => onChange({ title: value })}
          />
          <SectionTextarea
            label="Section copy"
            placeholder="Tell visitors the story behind this page, release, or project."
            value={section.body || ""}
            onChange={(value) => onChange({ body: value })}
          />
          <CtaFields section={section} onChange={onChange} />
        </>
      )}

      {section.type === "image" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Image URL"
            placeholder="https://images.example.com/artist-photo.jpg"
            value={section.imageUrl || ""}
            onChange={(value) => onChange({ imageUrl: value })}
          />
          <Field
            label="Image description"
            hint="Used as the image's accessible alt text; it is not shown on the page."
            placeholder="Vylanous performing live under purple lights"
            value={section.title || ""}
            onChange={(value) => onChange({ title: value })}
          />
        </div>
      )}

      {section.type === "pressKit" && (
        <>
          <Field
            label="Section heading"
            placeholder="Press materials"
            value={section.title || ""}
            onChange={(value) => onChange({ title: value })}
          />
          <SectionTextarea
            label="Press & booking details"
            placeholder="Add your bio, highlights, booking details, or one-sheet description."
            value={section.body || ""}
            onChange={(value) => onChange({ body: value })}
          />
          <CtaFields section={section} onChange={onChange} />
        </>
      )}

      {section.type === "merch" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Section heading"
              placeholder="Latest drop"
              value={section.title || ""}
              onChange={(value) => onChange({ title: value })}
            />
            <Field
              label="Fourthwall collection"
              hint="Use `all` for every product, or enter a collection handle from Fourthwall."
              placeholder="all"
              value={section.collection || ""}
              onChange={(value) => onChange({ collection: value })}
            />
          </div>
          <SectionTextarea
            label="Collection introduction"
            placeholder="Describe this drop or collection before the product grid."
            value={section.body || ""}
            onChange={(value) => onChange({ body: value })}
          />
        </>
      )}
    </article>
  );
}

function CtaFields({
  section,
  onChange,
}: {
  section: PageSection;
  onChange: (patch: Partial<PageSection>) => void;
}) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <Field
        label="Button label"
        placeholder="Browse beats"
        value={section.ctaLabel || ""}
        onChange={(value) => onChange({ ctaLabel: value })}
      />
      <Field
        label="Button destination"
        hint="Use a site path such as `/beats`, or a complete link such as `https://open.spotify.com/...`."
        placeholder="/beats"
        value={section.ctaHref || ""}
        onChange={(value) => onChange({ ctaHref: value })}
      />
    </div>
  );
}

function SectionTextarea({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-3 block font-body text-xs uppercase tracking-wider text-vb-silver/50">
      {label}
      <textarea
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-1.5 w-full rounded-lg border border-white/10 bg-vb-black px-3 py-2.5 font-body text-sm text-vb-silver-bright outline-none placeholder:text-vb-silver/25 focus:border-vb-purple-bright/60"
      />
    </label>
  );
}

function Field({
  label,
  hint,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block font-body text-xs uppercase tracking-wider text-vb-silver/50">
      {label}
      {hint && (
        <span className="mt-1 block normal-case tracking-normal text-vb-silver/35">{hint}</span>
      )}
      <input
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-white/10 bg-vb-black px-3 py-2.5 font-body text-sm normal-case tracking-normal text-vb-silver-bright outline-none placeholder:text-vb-silver/25 focus:border-vb-purple-bright/60"
      />
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
