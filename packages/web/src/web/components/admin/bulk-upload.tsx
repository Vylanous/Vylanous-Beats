/**
 * BulkUpload — drop or click to upload multiple beats at once.
 * For each file dropped, we create a draft beat record using the filename as title.
 * Artwork and preview audio are uploaded; delivery files can be added later via edit.
 * Supports: drag-and-drop, click-to-browse, multi-select.
 */
import { useRef, useState, useCallback } from "react";
import {
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Music2,
  FileAudio,
} from "lucide-react";
import { adminApi, uploadFile } from "../../lib/admin";

interface BulkItem {
  id: string;
  file: File;
  kind: "preview" | "artwork";
  title: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  beatId?: string;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function titleFromFilename(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

type UploadMode = "preview" | "artwork";

export function BulkUpload({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<UploadMode>("preview");
  const [items, setItems] = useState<BulkItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      const newItems: BulkItem[] = arr.map((f) => ({
        id: uid(),
        file: f,
        kind: mode,
        title: titleFromFilename(f.name),
        status: "pending",
      }));
      setItems((prev) => [...prev, ...newItems]);
    },
    [mode]
  );

  const remove = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const updateItem = (id: string, patch: Partial<BulkItem>) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );

  const updateTitle = (id: string, title: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, title } : i)));

  const runUpload = async () => {
    const pending = items.filter((i) => i.status === "pending");
    if (!pending.length) return;
    setRunning(true);

    for (const item of pending) {
      updateItem(item.id, { status: "uploading" });
      try {
        const folder = item.kind === "preview" ? "beats/preview" : "beats/artwork";
        const key = await uploadFile(item.file, folder);

        // Create a bare beat record with just the audio/artwork + title
        const beatData =
          item.kind === "preview"
            ? {
                title: item.title,
                bpm: 0,
                musicalKey: "",
                genre: "Hip-Hop",
                mood: "",
                tags: "",
                artworkUrl: "",
                audioUrl: key,
                fileUrls: {},
                priceFrom: 2400,
                soldExclusive: false,
                featured: false,
                published: false, // draft — edit before publishing
              }
            : {
                title: item.title,
                bpm: 0,
                musicalKey: "",
                genre: "Hip-Hop",
                mood: "",
                tags: "",
                artworkUrl: key,
                audioUrl: "",
                fileUrls: {},
                priceFrom: 2400,
                soldExclusive: false,
                featured: false,
                published: false,
              };

        const { id } = await adminApi.createBeat(beatData);
        updateItem(item.id, { status: "done", beatId: id });
      } catch (e) {
        updateItem(item.id, {
          status: "error",
          error: e instanceof Error ? e.message : "Failed",
        });
      }
    }
    setRunning(false);
  };

  const allDone = items.length > 0 && items.every((i) => i.status === "done");
  const hasErrors = items.some((i) => i.status === "error");
  const hasPending = items.some((i) => i.status === "pending");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-4xl uppercase tracking-wide text-chrome mb-1">
          Bulk Upload
        </h1>
        <p className="font-body text-sm text-vb-silver/50">
          Upload multiple beats at once. Each file becomes a draft — finish
          details (BPM, key, pricing, delivery files) by editing individually.
        </p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2">
        {(["preview", "artwork"] as UploadMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`font-sub uppercase tracking-wide text-sm px-5 py-2 rounded-xl border transition ${
              mode === m
                ? "border-vb-purple-bright bg-vb-purple/20 text-vb-silver-bright"
                : "border-white/10 text-vb-silver/50 hover:border-white/20 hover:text-vb-silver-bright"
            }`}
          >
            {m === "preview" ? "Preview Audio" : "Artwork Images"}
          </button>
        ))}
        <span className="font-body text-xs text-vb-silver/35 self-center ml-2">
          {mode === "preview"
            ? "MP3/WAV — tagged preview files"
            : "JPG/PNG — square artwork"}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => !running && inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center py-14 px-6 text-center select-none ${
          dragging
            ? "border-vb-purple-bright bg-vb-purple/10 scale-[1.01]"
            : "border-white/10 bg-white/[0.02] hover:border-vb-purple/50 hover:bg-white/[0.035]"
        }`}
      >
        <span className="h-16 w-16 rounded-2xl bg-vb-purple/20 grid place-items-center mb-4">
          {mode === "preview" ? (
            <FileAudio className="text-purple-glow" size={28} />
          ) : (
            <Music2 className="text-purple-glow" size={28} />
          )}
        </span>
        <p className="font-sub uppercase tracking-wide text-vb-silver-bright text-lg mb-1">
          {dragging ? "Drop it" : "Click or drag & drop"}
        </p>
        <p className="font-body text-sm text-vb-silver/40">
          {mode === "preview"
            ? "MP3 / WAV — select as many as you want"
            : "JPG / PNG / WebP — one per beat"}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={
            mode === "preview"
              ? "audio/mpeg,audio/wav,audio/mp3,.mp3,.wav"
              : "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          }
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Queue */}
      {items.length > 0 && (
        <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <span className="font-sub uppercase tracking-wide text-sm text-vb-silver-bright">
              Queue — {items.length} file{items.length !== 1 ? "s" : ""}
            </span>
            {!running && hasPending && (
              <button
                onClick={() =>
                  setItems((prev) =>
                    prev.filter((i) => i.status !== "pending")
                  )
                }
                className="font-body text-xs text-vb-silver/40 hover:text-red-400 transition"
              >
                Clear pending
              </button>
            )}
          </div>
          <ul className="divide-y divide-white/[0.05] max-h-72 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                {/* Status icon */}
                <span className="shrink-0">
                  {item.status === "pending" && (
                    <span className="h-8 w-8 rounded-lg bg-white/[0.04] grid place-items-center text-vb-silver/40">
                      <UploadCloud size={16} />
                    </span>
                  )}
                  {item.status === "uploading" && (
                    <span className="h-8 w-8 rounded-lg bg-vb-purple/15 grid place-items-center text-purple-glow">
                      <Loader2 size={16} className="animate-spin" />
                    </span>
                  )}
                  {item.status === "done" && (
                    <span className="h-8 w-8 rounded-lg bg-emerald-500/15 grid place-items-center text-emerald-400">
                      <CheckCircle2 size={16} />
                    </span>
                  )}
                  {item.status === "error" && (
                    <span className="h-8 w-8 rounded-lg bg-red-500/15 grid place-items-center text-red-400">
                      <AlertCircle size={16} />
                    </span>
                  )}
                </span>

                {/* Title input */}
                <div className="flex-1 min-w-0">
                  {item.status === "pending" ? (
                    <input
                      value={item.title}
                      onChange={(e) => updateTitle(item.id, e.target.value)}
                      className="w-full bg-transparent font-body text-sm text-vb-silver-bright border-b border-white/10 focus:border-vb-purple-bright/50 focus:outline-none pb-0.5 transition"
                    />
                  ) : (
                    <p className="font-body text-sm text-vb-silver-bright truncate">
                      {item.title}
                    </p>
                  )}
                  <p className="font-body text-xs text-vb-silver/35 truncate mt-0.5">
                    {item.status === "done"
                      ? "Draft created — edit to add details"
                      : item.status === "error"
                      ? item.error
                      : item.file.name}
                  </p>
                </div>

                {/* Size */}
                <span className="font-body text-xs text-vb-silver/35 shrink-0 tabular-nums">
                  {(item.file.size / 1024 / 1024).toFixed(1)} MB
                </span>

                {/* Remove */}
                {item.status === "pending" && (
                  <button
                    onClick={() => remove(item.id)}
                    className="h-7 w-7 grid place-items-center rounded-lg text-vb-silver/30 hover:text-red-400 hover:bg-red-500/10 transition shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {items.length > 0 && (
        <div className="flex gap-3 items-center">
          {hasPending && (
            <button
              onClick={runUpload}
              disabled={running}
              className="flex items-center gap-2 bg-vb-purple hover:bg-vb-purple-bright disabled:opacity-50 text-white font-sub uppercase tracking-wide px-6 py-3 rounded-xl transition"
            >
              {running ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <UploadCloud size={18} />
              )}
              {running
                ? "Uploading…"
                : `Upload ${items.filter((i) => i.status === "pending").length} beat${items.filter((i) => i.status === "pending").length !== 1 ? "s" : ""}`}
            </button>
          )}

          {allDone && (
            <button
              onClick={onDone}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-sub uppercase tracking-wide px-6 py-3 rounded-xl transition"
            >
              <CheckCircle2 size={18} />
              View all beats
            </button>
          )}

          {hasErrors && !running && (
            <button
              onClick={runUpload}
              className="flex items-center gap-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 font-sub uppercase tracking-wide px-5 py-3 rounded-xl transition"
            >
              Retry failed
            </button>
          )}

          {!running && (
            <button
              onClick={() => setItems([])}
              className="font-sub uppercase tracking-wide text-vb-silver/40 hover:text-vb-silver-bright px-5 py-3 rounded-xl hover:bg-white/[0.04] transition"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
