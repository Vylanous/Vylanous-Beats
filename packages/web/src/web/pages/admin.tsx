import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  Music2,
  ShoppingBag,
  Users,
  LogOut,
  Plus,
  Loader2,
  Lock,
  Upload,
  Palette,
} from "lucide-react";
import {
  adminApi,
  getToken,
  setToken,
  clearToken,
  type AdminBeat,
  type AdminOrder,
} from "../lib/admin";
import { formatCad } from "../../shared/licenses";
import { BeatForm } from "../components/admin/beat-form";
import { BeatTable } from "../components/admin/beat-table";
import CustomizationPanel from "../components/admin/customization";
import { BulkUpload } from "../components/admin/bulk-upload";

type Tab = "overview" | "beats" | "bulk" | "orders" | "subscribers" | "customization";

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setAuthed(false);
      return;
    }
    adminApi
      .me()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <div className="min-h-screen grid place-items-center bg-vb-black">
        <Loader2 className="animate-spin text-vb-purple-bright" size={28} />
      </div>
    );
  }

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;
  return (
    <Dashboard
      onLogout={() => {
        clearToken();
        setAuthed(false);
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */
function Login({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const { token } = await adminApi.login(pw);
      setToken(token);
      onSuccess();
    } catch {
      setErr("Wrong password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-vb-black px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/brand/skull-mark.png"
            alt=""
            className="h-16 w-16 mx-auto object-contain mb-4"
          />
          <h1 className="font-display text-3xl uppercase tracking-wide text-chrome">
            Admin Studio
          </h1>
          <p className="font-body text-vb-silver/60 mt-1 text-sm">
            Vylanous Beats — owner access only
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-vb-silver/40"
              size={18}
            />
            <input
              aria-label="Admin password"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 font-body text-vb-silver-bright placeholder:text-vb-silver/40 focus:outline-none focus:border-vb-purple-bright/60 focus:bg-white/[0.06] transition"
            />
          </div>
          {err && <p className="text-red-400 text-sm font-body">{err}</p>}
          <button
            disabled={loading || !pw}
            className="w-full bg-vb-purple hover:bg-vb-purple-bright disabled:opacity-50 text-white font-sub uppercase tracking-wider py-3.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Enter Studio"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState<AdminBeat | null>(null);
  const [creating, setCreating] = useState(false);

  const nav: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "beats", label: "Beats", icon: Music2 },
    { id: "bulk", label: "Bulk Upload", icon: Upload },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "subscribers", label: "Fan List", icon: Users },
    { id: "customization", label: "Customization", icon: Palette },
  ];

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-vb-black text-vb-silver-bright flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-white/[0.06] bg-vb-black/60 hidden md:flex flex-col fixed inset-y-0">
        <div className="px-5 h-16 flex items-center gap-2.5 border-b border-white/[0.06]">
          <img src="/brand/skull-mark.png" alt="" className="h-8 w-8 object-contain" />
          <span className="font-display uppercase tracking-wide text-lg">Studio</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                setTab(n.id);
                closeForm();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-body text-sm transition ${
                tab === n.id
                  ? "bg-vb-purple/20 text-purple-glow border border-vb-purple/30"
                  : "text-vb-silver/70 hover:text-vb-silver-bright hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <n.icon size={18} />
              {n.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/[0.06] space-y-1">
          <a
            href="/"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-body text-sm text-vb-silver/70 hover:text-vb-silver-bright hover:bg-white/[0.04] transition"
          >
            View store →
          </a>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-body text-sm text-vb-silver/70 hover:text-red-400 hover:bg-white/[0.04] transition"
          >
            <LogOut size={18} /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-vb-black/90 backdrop-blur border-b border-white/[0.06] flex items-center justify-between px-4 h-14">
        <span className="font-display uppercase tracking-wide">Studio</span>
        <div className="flex gap-1">
          {nav.map((n) => (
            <button
              aria-label={n.label}
              key={n.id}
              onClick={() => {
                setTab(n.id);
                closeForm();
              }}
              className={`p-2 rounded-lg ${tab === n.id ? "text-purple-glow" : "text-vb-silver/60"}`}
            >
              <n.icon size={18} />
            </button>
          ))}
          <button aria-label="Log out" onClick={onLogout} className="p-2 text-vb-silver/60">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 md:ml-60 pt-20 md:pt-8 px-5 sm:px-8 pb-16 max-w-5xl">
        {creating || editing ? (
          <BeatForm
            beat={editing}
            onCancel={closeForm}
            onSaved={() => {
              closeForm();
            }}
          />
        ) : (
          <>
            {tab === "overview" && <Overview onAdd={() => setCreating(true)} onTab={setTab} />}
            {tab === "beats" && (
              <BeatsTab onAdd={() => setCreating(true)} onEdit={(b) => setEditing(b)} />
            )}
            {tab === "bulk" && <BulkUpload onDone={() => setTab("beats")} />}
            {tab === "orders" && <OrdersTab />}
            {tab === "subscribers" && <SubscribersTab />}
            {tab === "customization" && <CustomizationPanel />}
          </>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */
function Overview({ onAdd, onTab }: { onAdd: () => void; onTab: (t: Tab) => void }) {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof adminApi.stats>> | null>(null);
  useEffect(() => {
    adminApi
      .stats()
      .then(setStats)
      .catch(() => {});
  }, []);

  const cards = [
    { label: "Total Beats", value: stats?.beats ?? "—", sub: `${stats?.published ?? 0} live` },
    { label: "Orders", value: stats?.orders ?? "—", sub: `${stats?.paidOrders ?? 0} paid` },
    {
      label: "Revenue",
      value: stats ? "$" + (stats.revenueCents / 100).toFixed(0) : "—",
      sub: "all time CAD",
    },
    { label: "Fan List", value: stats?.subscribers ?? "—", sub: "subscribers" },
  ];

  return (
    <div>
      <Header title="Overview" action={<AddBtn onClick={onAdd} />} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
            <div className="font-body text-xs uppercase tracking-wider text-vb-silver/50">
              {c.label}
            </div>
            <div className="font-display text-4xl text-chrome mt-2 leading-none">{c.value}</div>
            <div className="font-body text-xs text-vb-silver/40 mt-1.5">{c.sub}</div>
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <QuickCard
          title="New beat"
          desc="Add a single beat with artwork, preview & files."
          onClick={onAdd}
          icon={Plus}
        />
        <QuickCard
          title="Bulk upload"
          desc="Drop multiple audio files or artwork at once."
          onClick={() => onTab("bulk")}
          icon={Upload}
        />
        <QuickCard
          title="View orders"
          desc="See who bought what and license tiers."
          onClick={() => onTab("orders")}
          icon={ShoppingBag}
        />
      </div>
    </div>
  );
}

function QuickCard({
  title,
  desc,
  onClick,
  icon: Icon,
}: {
  title: string;
  desc: string;
  onClick: () => void;
  icon: typeof Plus;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.07] hover:border-vb-purple/40 rounded-2xl p-5 transition group"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="h-9 w-9 rounded-lg bg-vb-purple/20 grid place-items-center text-purple-glow group-hover:scale-105 transition">
          <Icon size={18} />
        </span>
        <span className="font-sub uppercase tracking-wide text-vb-silver-bright">{title}</span>
      </div>
      <p className="font-body text-sm text-vb-silver/50">{desc}</p>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Beats tab                                                           */
/* ------------------------------------------------------------------ */
function BeatsTab({ onAdd, onEdit }: { onAdd: () => void; onEdit: (b: AdminBeat) => void }) {
  const [beats, setBeats] = useState<AdminBeat[] | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    setErr("");
    adminApi
      .listBeats()
      .then((r) => setBeats(r.beats))
      .catch((e) => setErr(e.message));
  }, []);
  useEffect(load, [load]);

  const remove = async (b: AdminBeat) => {
    if (!confirm(`Delete "${b.title}"? This can't be undone.`)) return;
    await adminApi.deleteBeat(b.id);
    load();
  };
  const toggle = async (b: AdminBeat, field: "published" | "featured") => {
    await adminApi.updateBeat(b.id, { [field]: !b[field] } as never);
    load();
  };

  return (
    <div>
      <Header title="Beats" action={<AddBtn onClick={onAdd} />} />
      {err && <p className="text-red-400 font-body text-sm mb-4">{err}</p>}
      {beats === null ? (
        <Loading />
      ) : beats.length === 0 ? (
        <Empty label="No beats yet. Upload your first one." onAdd={onAdd} />
      ) : (
        <BeatTable beats={beats} onEdit={onEdit} onDelete={remove} onToggle={toggle} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Orders tab                                                          */
/* ------------------------------------------------------------------ */
function OrdersTab() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  useEffect(() => {
    adminApi
      .listOrders()
      .then((r) => setOrders(r.orders))
      .catch(() => setOrders([]));
  }, []);

  return (
    <div>
      <Header title="Orders" />
      {orders === null ? (
        <Loading />
      ) : orders.length === 0 ? (
        <Empty label="No orders yet." />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-body text-vb-silver-bright">{o.name || o.email}</div>
                  <div className="font-body text-xs text-vb-silver/50">{o.email}</div>
                </div>
                <div className="text-right">
                  <span
                    className={`font-sub uppercase text-xs px-2.5 py-1 rounded-full ${o.status === "paid" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}
                  >
                    {o.status}
                  </span>
                  <div className="font-display text-xl text-chrome mt-1">
                    {formatCad(o.totalCents)}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap gap-2">
                {o.items.map((it) => (
                  <span
                    key={it.id}
                    className="font-body text-xs bg-white/[0.04] border border-white/[0.06] rounded-md px-2 py-1 text-vb-silver/70"
                  >
                    {it.beatTitle} · {it.licenseName}
                  </span>
                ))}
              </div>
              <div className="font-body text-[11px] text-vb-silver/30 mt-2">
                {new Date(o.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Subscribers tab                                                     */
/* ------------------------------------------------------------------ */
function SubscribersTab() {
  const [subs, setSubs] = useState<{ id: string; email: string; createdAt: string }[] | null>(null);
  useEffect(() => {
    adminApi
      .listSubscribers()
      .then((r) => setSubs(r.subscribers))
      .catch(() => setSubs([]));
  }, []);

  const copyAll = () => {
    if (subs) navigator.clipboard.writeText(subs.map((s) => s.email).join(", "));
  };

  return (
    <div>
      <Header
        title="Fan List"
        action={
          subs && subs.length > 0 ? (
            <button
              onClick={copyAll}
              className="font-sub uppercase text-sm tracking-wide px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 transition"
            >
              Copy all emails
            </button>
          ) : undefined
        }
      />
      {subs === null ? (
        <Loading />
      ) : subs.length === 0 ? (
        <Empty label="No subscribers yet." />
      ) : (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl divide-y divide-white/[0.05]">
          {subs.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3">
              <span className="font-body text-sm text-vb-silver-bright">{s.email}</span>
              <span className="font-body text-xs text-vb-silver/40">
                {new Date(s.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */
function Header({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6 gap-4">
      <h1 className="font-display text-4xl uppercase tracking-wide text-chrome">{title}</h1>
      {action}
    </div>
  );
}
function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-vb-purple hover:bg-vb-purple-bright text-white font-sub uppercase tracking-wide text-sm px-4 py-2.5 rounded-lg transition"
    >
      <Plus size={16} /> New beat
    </button>
  );
}
function Loading() {
  return (
    <div className="grid place-items-center py-20">
      <Loader2 className="animate-spin text-vb-purple-bright" size={26} />
    </div>
  );
}
function Empty({ label, onAdd }: { label: string; onAdd?: () => void }) {
  return (
    <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
      <p className="font-body text-vb-silver/50 mb-4">{label}</p>
      {onAdd && <AddBtn onClick={onAdd} />}
    </div>
  );
}
