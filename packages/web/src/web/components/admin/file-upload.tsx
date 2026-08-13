/* oxlint-disable jsx-a11y/prefer-tag-over-role -- the composite drop zone contains nested controls and cannot be a button */
import { useId, useRef, useState } from "react";
import { UploadCloud, Loader2, CheckCircle2, X, Image as ImageIcon, Music } from "lucide-react";
import { uploadFile } from "../../lib/admin";

interface Props {
  label: string;
  hint?: string;
  accept: string;
  folder: string;
  kind?: "image" | "audio" | "file";
  /** current stored key (or empty) */
  value: string;
  /** preview url if available (signed) */
  previewUrl?: string;
  onChange: (key: string) => void;
}

export function FileUpload({
  label,
  hint,
  accept,
  folder,
  kind = "file",
  value,
  previewUrl,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [localPreview, setLocalPreview] = useState<string>("");
  const [filename, setFilename] = useState<string>("");

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setErr("");
    setUploading(true);
    setFilename(file.name);
    if (kind === "image") setLocalPreview(URL.createObjectURL(file));
    try {
      const key = await uploadFile(file, folder);
      onChange(key);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
      setFilename("");
    } finally {
      setUploading(false);
    }
  };

  const preview = localPreview || previewUrl || "";
  const hasFile = !!value;
  const Icon = kind === "image" ? ImageIcon : kind === "audio" ? Music : UploadCloud;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="font-body text-xs uppercase tracking-wider text-vb-silver/50 mb-1.5 block"
      >
        {label}
      </label>
      {/* A semantic button cannot contain the file input, preview player, and remove button. */}
      <div
        role="button"
        tabIndex={uploading ? -1 : 0}
        aria-label={`Upload ${label}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!uploading && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handle(e.dataTransfer.files[0]);
        }}
        className={`relative cursor-pointer rounded-xl border border-dashed transition px-4 py-4 flex items-center gap-3 ${
          hasFile
            ? "border-emerald-500/30 bg-emerald-500/[0.04]"
            : "border-white/12 bg-white/[0.02] hover:border-vb-purple/50 hover:bg-white/[0.04]"
        }`}
      >
        {kind === "image" && preview ? (
          <img src={preview} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
        ) : (
          <span
            className={`h-12 w-12 rounded-lg grid place-items-center shrink-0 ${hasFile ? "bg-emerald-500/15 text-emerald-400" : "bg-vb-purple/15 text-purple-glow"}`}
          >
            {uploading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : hasFile ? (
              <CheckCircle2 size={20} />
            ) : (
              <Icon size={20} />
            )}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="font-body text-sm text-vb-silver-bright truncate">
            {uploading
              ? "Uploading…"
              : hasFile
                ? filename || "File attached"
                : "Click or drag to upload"}
          </div>
          {hint && !hasFile && !uploading && (
            <div className="font-body text-xs text-vb-silver/40 mt-0.5">{hint}</div>
          )}
          {hasFile && !uploading && (
            <div className="font-body text-xs text-emerald-400/70 mt-0.5">Ready</div>
          )}
        </div>

        {kind === "audio" &&
          preview &&
          hasFile && (
            // oxlint-disable-next-line jsx-a11y/media-has-caption -- uploaded instrumental preview; no spoken content to caption
            <audio
              src={preview}
              controls
              aria-label={`${label} preview`}
              className="h-8 max-w-[140px]"
              onClick={(e) => e.stopPropagation()}
            />
          )}

        {hasFile && !uploading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setFilename("");
              setLocalPreview("");
            }}
            aria-label={`Remove ${label}`}
            className="h-8 w-8 grid place-items-center rounded-lg text-vb-silver/40 hover:text-red-400 hover:bg-red-500/10 transition shrink-0"
          >
            <X size={16} />
          </button>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          aria-label={label}
          accept={accept}
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0])}
        />
      </div>
      {err && <p className="text-red-400 font-body text-xs mt-1.5">{err}</p>}
    </div>
  );
}
