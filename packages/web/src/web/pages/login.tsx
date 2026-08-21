import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "../components/layout";
import { useCustomer } from "../lib/customer";
import { useSiteSettings } from "../lib/site-settings";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { signIn, signUp } = useCustomer();
  const { pages } = useSiteSettings();
  const loginPage = pages.find((page) => page.path === "/login");
  const loginHero = loginPage?.sections.find(
    (section) => section.type === "hero",
  );
  const eyebrow = loginHero?.eyebrow || "Customer portal";
  const title = loginHero?.title || "Keep every license in your vault.";
  const body =
    loginHero?.body ||
    "Sign in to unlock the full beat catalog, purchase licenses, access secure downloads, and keep your order history across the website and mobile app.";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") await signIn(email, password);
      else await signUp({ email, password, displayName, marketingOptIn });
      navigate("/dashboard");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not complete your request.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Layout>
      <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-28 lg:grid-cols-[1fr_.85fr]">
        <section>
          <p className="font-sub text-xs uppercase tracking-[.24em] text-vb-purple-bright">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-6xl uppercase leading-[.88] text-chrome sm:text-8xl">
            {title}
          </h1>
          <p className="mt-7 max-w-xl font-body leading-7 text-vb-silver/65">
            {body}
          </p>
        </section>
        <form
          onSubmit={submit}
          className="rounded-3xl border border-white/[.09] bg-vb-ink p-6 shadow-2xl shadow-black/30 sm:p-8"
        >
          <div className="flex rounded-xl bg-vb-black/60 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-3 font-sub text-xs uppercase tracking-wide ${mode === "login" ? "bg-vb-purple text-white" : "text-vb-silver/60"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg py-3 font-sub text-xs uppercase tracking-wide ${mode === "register" ? "bg-vb-purple text-white" : "text-vb-silver/60"}`}
            >
              Create account
            </button>
          </div>
          {mode === "register" && (
            <input
              aria-label="Artist or display name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Artist or display name"
              className="mt-5 w-full rounded-xl border border-white/10 bg-vb-black px-4 py-3.5 font-body outline-none focus:border-vb-purple"
            />
          )}
          <input
            aria-label="Email address"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            className="mt-3 w-full rounded-xl border border-white/10 bg-vb-black px-4 py-3.5 font-body outline-none focus:border-vb-purple"
          />
          <input
            aria-label="Password"
            required
            minLength={10}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (10+ characters)"
            className="mt-3 w-full rounded-xl border border-white/10 bg-vb-black px-4 py-3.5 font-body outline-none focus:border-vb-purple"
          />
          {mode === "register" && (
            <label className="mt-5 flex cursor-pointer items-start gap-3 font-body text-sm text-vb-silver/65">
              <input
                aria-label="Receive release updates, studio notes, and occasional offers"
                type="checkbox"
                checked={marketingOptIn}
                onChange={(event) => setMarketingOptIn(event.target.checked)}
                className="mt-1 accent-vb-purple"
              />
              Send me release updates, studio notes, and occasional offers.
            </label>
          )}
          {error && (
            <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 font-body text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="mt-6 w-full rounded-xl bg-vb-purple py-4 font-sub text-sm uppercase tracking-wide text-white transition hover:bg-vb-purple-bright disabled:opacity-60"
          >
            {busy
              ? "Working…"
              : mode === "login"
                ? "Enter your vault"
                : "Create your vault"}
          </button>
        </form>
      </main>
    </Layout>
  );
}
