import { useEffect } from "react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Download, Mail, Music2, ShoppingBag } from "lucide-react";
import { Layout } from "../components/layout";
import { useCustomer } from "../lib/customer";
import { formatCad } from "../../shared/licenses";

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { ready, customer, dashboard, updatePreferences, resendVerification, signOut } =
    useCustomer();
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  useEffect(() => {
    if (ready && !customer) navigate("/login");
  }, [customer, navigate, ready]);
  if (!customer || !dashboard)
    return (
      <Layout>
        <div className="grid min-h-screen place-items-center font-sub uppercase tracking-wide text-vb-purple-bright">
          Loading your vault…
        </div>
      </Layout>
    );
  return (
    <Layout>
      <main className="mx-auto max-w-7xl px-5 pb-20 pt-28 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-sub text-xs uppercase tracking-[.24em] text-vb-purple-bright">
              Customer portal
            </p>
            <h1 className="mt-3 font-display text-5xl uppercase text-chrome sm:text-7xl">
              {customer.displayName || "Your music vault"}
            </h1>
            <p className="mt-3 font-body text-vb-silver/60">{customer.email}</p>
          </div>
          <button
            onClick={() => signOut().then(() => navigate("/"))}
            className="rounded-lg border border-white/10 px-4 py-2.5 font-sub text-xs uppercase tracking-wide text-vb-silver hover:border-vb-purple"
          >
            Sign out
          </button>
        </div>
        {!customer.emailVerified && (
          <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-vb-purple/40 bg-vb-purple/[.08] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-sub text-xs uppercase tracking-[.2em] text-vb-purple-bright">
                Email verification required
              </p>
              <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-vb-silver/70">
                Verify {customer.email} to unlock the complete catalog, checkout, and secure license
                downloads.
              </p>
            </div>
            <button
              type="button"
              disabled={verificationStatus === "sending"}
              onClick={async () => {
                setVerificationStatus("sending");
                try {
                  await resendVerification();
                  setVerificationStatus("sent");
                } catch {
                  setVerificationStatus("error");
                }
              }}
              className="shrink-0 rounded-lg bg-vb-purple px-4 py-3 font-sub text-xs uppercase tracking-wide text-white transition hover:bg-vb-purple-bright disabled:cursor-wait disabled:opacity-60"
            >
              {verificationStatus === "sending"
                ? "Sending…"
                : verificationStatus === "sent"
                  ? "Email sent"
                  : "Resend email"}
            </button>
            {verificationStatus === "error" && (
              <p className="font-body text-xs text-red-300">
                Unable to resend right now. Try again shortly.
              </p>
            )}
          </section>
        )}
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <Stat
            icon={<Music2 size={18} />}
            label="Licenses owned"
            value={String(dashboard.insights.licensesOwned)}
          />
          <Stat
            icon={<ShoppingBag size={18} />}
            label="Paid orders"
            value={String(dashboard.insights.paidOrders)}
          />
          <Stat
            icon={<Download size={18} />}
            label="Invested"
            value={formatCad(dashboard.insights.totalSpentCents)}
          />
        </section>
        <section className="mt-8 grid gap-7 lg:grid-cols-[1.5fr_.75fr]">
          <div className="rounded-2xl border border-white/[.08] bg-vb-ink p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl uppercase text-chrome">License library</h2>
                <p className="mt-1 font-body text-sm text-vb-silver/55">
                  Your active entitlements and secure downloads.
                </p>
              </div>
              <Link
                to="/beats"
                className="font-sub text-xs uppercase tracking-wide text-vb-purple-bright hover:text-white"
              >
                Browse upsells
              </Link>
            </div>
            <div className="mt-6 space-y-3">
              {dashboard.entitlements.length ? (
                dashboard.entitlements.map((entitlement) => (
                  <div
                    key={entitlement.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[.07] bg-vb-black/35 p-4"
                  >
                    <div>
                      <p className="font-sub text-lg uppercase text-vb-silver-bright">
                        {entitlement.beatTitle}
                      </p>
                      <p className="mt-1 font-body text-sm text-vb-silver/55">
                        {entitlement.licenseName}
                      </p>
                    </div>
                    <a
                      href={entitlement.downloadUrl}
                      className="inline-flex items-center gap-2 rounded-lg border border-vb-purple/50 px-3 py-2 font-sub text-xs uppercase tracking-wide text-vb-purple-bright hover:bg-vb-purple/10"
                    >
                      <Download size={14} /> Download
                    </a>
                  </div>
                ))
              ) : (
                <p className="rounded-xl bg-vb-black/30 p-5 font-body text-vb-silver/60">
                  Your confirmed licenses will appear here after purchase.
                </p>
              )}
            </div>
          </div>
          <aside className="space-y-5">
            <div className="rounded-2xl border border-white/[.08] bg-vb-ink p-5">
              <div className="flex items-start gap-3">
                <Mail className="mt-1 text-vb-purple-bright" size={18} />
                <div>
                  <h2 className="font-sub text-xl uppercase tracking-wide">Stay in the loop</h2>
                  <p className="mt-2 font-body text-sm leading-6 text-vb-silver/55">
                    Release alerts, studio notes, and occasional license offers—controlled from your
                    account.
                  </p>
                  <label className="mt-4 flex items-center gap-3 font-body text-sm text-vb-silver">
                    <input
                      aria-label="Receive release updates and offers"
                      type="checkbox"
                      checked={customer.marketingOptIn}
                      onChange={(event) =>
                        updatePreferences({ marketingOptIn: event.target.checked })
                      }
                      className="h-4 w-4 accent-vb-purple"
                    />
                    Receive updates and offers
                  </label>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-vb-purple/25 bg-vb-purple/[.07] p-5">
              <p className="font-sub text-xs uppercase tracking-[.2em] text-vb-purple-bright">
                Next session
              </p>
              <h2 className="mt-2 font-display text-3xl uppercase text-chrome">
                Find your next sound.
              </h2>
              <p className="mt-3 font-body text-sm leading-6 text-vb-silver/65">
                Your account unlocks the complete Vylanous catalog and keeps every future license in
                one secure library.
              </p>
              <Link
                to="/beats"
                className="mt-5 inline-flex rounded-lg bg-vb-purple px-4 py-3 font-sub text-xs uppercase tracking-wide text-white hover:bg-vb-purple-bright"
              >
                Explore catalog
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </Layout>
  );
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[.08] bg-vb-ink p-5">
      <div className="flex items-center gap-2 text-vb-purple-bright">
        {icon}
        <span className="font-sub text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-4 font-display text-4xl text-chrome">{value}</p>
    </div>
  );
}
