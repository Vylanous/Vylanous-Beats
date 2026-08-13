import { Pencil, Trash2, Star, Eye, EyeOff } from "lucide-react";
import type { AdminBeat } from "../../lib/admin";
import { formatCad } from "../../../shared/licenses";

export function BeatTable({
  beats,
  onEdit,
  onDelete,
  onToggle,
}: {
  beats: AdminBeat[];
  onEdit: (b: AdminBeat) => void;
  onDelete: (b: AdminBeat) => void;
  onToggle: (b: AdminBeat, field: "published" | "featured") => void;
}) {
  return (
    <div className="space-y-2.5">
      {beats.map((b) => (
        <div
          key={b.id}
          className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-xl p-2.5 sm:p-3"
        >
          <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-vb-purple/10 grid place-items-center">
            {b.artworkSignedUrl || b.artworkUrl ? (
              <img
                src={b.artworkSignedUrl || b.artworkUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-display text-vb-purple-bright text-xs">N/A</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-sub uppercase tracking-wide text-vb-silver-bright truncate">
                {b.title}
              </span>
              {b.featured && <Star size={13} className="text-amber-400 fill-amber-400 shrink-0" />}
              {b.soldExclusive && (
                <span className="font-body text-[10px] uppercase bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded shrink-0">
                  Sold
                </span>
              )}
            </div>
            <div className="font-body text-xs text-vb-silver/45 flex gap-2 mt-0.5">
              {b.bpm > 0 && <span>{b.bpm} BPM</span>}
              {b.musicalKey && <span>· {b.musicalKey}</span>}
              <span>· from {formatCad(b.priceFrom)}</span>
              <span>· {b.plays} plays</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <IconBtn
              title={b.published ? "Published — click to hide" : "Hidden — click to publish"}
              active={b.published}
              onClick={() => onToggle(b, "published")}
            >
              {b.published ? <Eye size={16} /> : <EyeOff size={16} />}
            </IconBtn>
            <IconBtn title="Feature" active={b.featured} onClick={() => onToggle(b, "featured")}>
              <Star size={16} className={b.featured ? "fill-current" : ""} />
            </IconBtn>
            <IconBtn title="Edit" onClick={() => onEdit(b)}>
              <Pencil size={16} />
            </IconBtn>
            <IconBtn title="Delete" danger onClick={() => onDelete(b)}>
              <Trash2 size={16} />
            </IconBtn>
          </div>
        </div>
      ))}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  active,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`h-9 w-9 grid place-items-center rounded-lg transition border ${
        danger
          ? "text-vb-silver/50 hover:text-red-400 hover:bg-red-500/10 border-transparent hover:border-red-500/20"
          : active
            ? "text-purple-glow bg-vb-purple/15 border-vb-purple/30"
            : "text-vb-silver/50 hover:text-vb-silver-bright hover:bg-white/[0.06] border-transparent"
      }`}
    >
      {children}
    </button>
  );
}
