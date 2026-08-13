import { useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { adminApi, type AdminBeat, type BeatInput } from "../../lib/admin";
import { FileUpload } from "./file-upload";

const TIER_FILES: { id: string; label: string; hint: string }[] = [
  { id: "free", label: "Free / Demo file", hint: "Tagged MP3 buyers get free" },
  { id: "mp3", label: "MP3 Lease file", hint: "Untagged MP3" },
  { id: "wav", label: "WAV Lease file", hint: "WAV + MP3 (zip recommended)" },
  { id: "unlimited", label: "Unlimited file", hint: "WAV + MP3 + stems (zip)" },
  { id: "exclusive", label: "Exclusive file", hint: "Full stems package (zip)" },
];

export function BeatForm({
  beat,
  onCancel,
  onSaved,
}: {
  beat: AdminBeat | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const editing = !!beat;
  const initialFiles: Record<string, string> = (() => {
    if (!beat) return {};
    try {
      return JSON.parse(beat.fileUrls || "{}");
    } catch {
      return {};
    }
  })();

  const [form, setForm] = useState<BeatInput>({
    title: beat?.title ?? "",
    bpm: beat?.bpm ?? 0,
    musicalKey: beat?.musicalKey ?? "",
    genre: beat?.genre ?? "Hip-Hop",
    mood: beat?.mood ?? "",
    tags: beat?.tags ?? "",
    artworkUrl: beat?.artworkUrl ?? "",
    audioUrl: beat?.audioUrl ?? "",
    fileUrls: initialFiles,
    priceFrom: beat?.priceFrom ?? 2400,
    soldExclusive: beat?.soldExclusive ?? false,
    featured: beat?.featured ?? false,
    published: beat?.published ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = <K extends keyof BeatInput>(k: K, v: BeatInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const setFile = (tier: string, key: string) =>
    setForm((f) => ({ ...f, fileUrls: { ...f.fileUrls, [tier]: key } }));

  const save = async () => {
    if (!form.title.trim()) {
      setErr("Give the beat a title.");
      return;
    }
    setErr("");
    setSaving(true);
    try {
      if (editing && beat) await adminApi.updateBeat(beat.id, form);
      else await adminApi.createBeat(form);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button
        onClick={onCancel}
        className="flex items-center gap-2 font-body text-sm text-vb-silver/60 hover:text-vb-silver-bright mb-5 transition"
      >
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="font-display text-4xl uppercase tracking-wide text-chrome mb-6">
        {editing ? "Edit beat" : "New beat"}
      </h1>

      <div className="space-y-6 max-w-2xl">
        {/* Details */}
        <Section title="Details">
          <Field label="Title">
            <input
              aria-label="Title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Midnight Drip"
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="BPM">
              <input
                aria-label="BPM"
                type="number"
                value={form.bpm || ""}
                onChange={(e) => set("bpm", Number(e.target.value) || 0)}
                placeholder="140"
                className={inputCls}
              />
            </Field>
            <Field label="Key">
              <input
                aria-label="Musical key"
                value={form.musicalKey}
                onChange={(e) => set("musicalKey", e.target.value)}
                placeholder="C# Minor"
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Genre">
              <input
                aria-label="Genre"
                value={form.genre}
                onChange={(e) => set("genre", e.target.value)}
                placeholder="Hip-Hop"
                className={inputCls}
              />
            </Field>
            <Field label="Mood">
              <input
                aria-label="Mood"
                value={form.mood}
                onChange={(e) => set("mood", e.target.value)}
                placeholder="Dark / Melodic"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Tags" hint="Comma separated — helps search & discovery">
            <input
              aria-label="Tags"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="trap, dark, 808, melodic"
              className={inputCls}
            />
          </Field>
          <Field
            label="“From” price (lowest paid tier)"
            hint="Shown as the starting price. In dollars."
          >
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-vb-silver/40">$</span>
              <input
                aria-label="Lowest paid tier price in dollars"
                type="number"
                step="0.01"
                value={(form.priceFrom / 100).toString()}
                onChange={(e) => set("priceFrom", Math.round((Number(e.target.value) || 0) * 100))}
                className={inputCls + " pl-8"}
              />
            </div>
          </Field>
        </Section>

        {/* Media */}
        <Section title="Cover & preview">
          <FileUpload
            label="Artwork"
            hint="JPG / PNG, square works best"
            accept="image/*"
            folder="beats/artwork"
            kind="image"
            value={form.artworkUrl}
            previewUrl={beat?.artworkSignedUrl}
            onChange={(k) => set("artworkUrl", k)}
          />
          <FileUpload
            label="Preview audio (public stream)"
            hint="Tagged MP3 — what visitors hear on the store"
            accept="audio/*"
            folder="beats/preview"
            kind="audio"
            value={form.audioUrl}
            previewUrl={beat?.audioSignedUrl}
            onChange={(k) => set("audioUrl", k)}
          />
        </Section>

        {/* Delivery files */}
        <Section
          title="Delivery files"
          desc="What buyers download for each license. Upload a zip for multi-file tiers. Only the tiers you sell need files."
        >
          {TIER_FILES.map((t) => (
            <FileUpload
              key={t.id}
              label={t.label}
              hint={t.hint}
              accept="audio/*,application/zip,.zip,.rar,.wav,.mp3"
              folder={`beats/delivery/${t.id}`}
              kind="file"
              value={form.fileUrls[t.id] || ""}
              onChange={(k) => setFile(t.id, k)}
            />
          ))}
        </Section>

        {/* Visibility */}
        <Section title="Visibility">
          <Toggle
            label="Published"
            desc="Live on the store"
            checked={form.published}
            onChange={(v) => set("published", v)}
          />
          <Toggle
            label="Featured"
            desc="Show on homepage spotlight"
            checked={form.featured}
            onChange={(v) => set("featured", v)}
          />
          <Toggle
            label="Sold exclusively"
            desc="Mark exclusive license as taken"
            checked={form.soldExclusive}
            onChange={(v) => set("soldExclusive", v)}
          />
        </Section>

        {err && <p className="text-red-400 font-body text-sm">{err}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-vb-purple hover:bg-vb-purple-bright disabled:opacity-50 text-white font-sub uppercase tracking-wide px-6 py-3 rounded-xl transition"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {editing ? "Save changes" : "Publish beat"}
          </button>
          <button
            onClick={onCancel}
            className="font-sub uppercase tracking-wide px-6 py-3 rounded-xl text-vb-silver/70 hover:text-vb-silver-bright hover:bg-white/[0.05] transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 font-body text-vb-silver-bright placeholder:text-vb-silver/35 focus:outline-none focus:border-vb-purple-bright/60 focus:bg-white/[0.06] transition";

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5">
      <h2 className="font-sub uppercase tracking-wide text-vb-silver-bright text-lg">{title}</h2>
      {desc && <p className="font-body text-xs text-vb-silver/45 mt-1 mb-4">{desc}</p>}
      <div className={`space-y-4 ${desc ? "" : "mt-4"}`}>{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="font-body text-xs uppercase tracking-wider text-vb-silver/50 mb-1.5 block">
        {label}
      </label>
      {children}
      {hint && <p className="font-body text-xs text-vb-silver/35 mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between text-left group"
    >
      <div>
        <div className="font-body text-sm text-vb-silver-bright">{label}</div>
        <div className="font-body text-xs text-vb-silver/45">{desc}</div>
      </div>
      <span
        className={`relative h-6 w-11 rounded-full transition shrink-0 ${checked ? "bg-vb-purple" : "bg-white/10"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}
