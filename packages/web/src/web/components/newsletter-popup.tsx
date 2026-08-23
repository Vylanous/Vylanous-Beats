import { useEffect, useState } from "react";
import { Check, Mail, X } from "lucide-react";
import { useSiteSettings } from "../lib/site-settings";

const SEEN_KEY = "vb-newsletter-popup-seen";
const SUBSCRIBED_KEY = "vb-newsletter-subscribed";

type PopupState = "idle" | "submitting" | "success" | "error";

function readFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // Storage may be unavailable in private browsing contexts.
  }
}

export function NewsletterPopup() {
  const { newsletterPopup: config, theme } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<PopupState>("idle");

  useEffect(() => {
    if (!config.enabled || (config.homeOnly && window.location.pathname !== "/")) return;
    if (config.showOnce && (readFlag(SEEN_KEY) || readFlag(SUBSCRIBED_KEY))) return;

    const timer = window.setTimeout(() => {
      if (config.showOnce) writeFlag(SEEN_KEY);
      setOpen(true);
    }, config.delayMs);

    return () => window.clearTimeout(timer);
  }, [config.delayMs, config.enabled, config.homeOnly, config.showOnce]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  const dismiss = () => setOpen(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!consent) return;
    setState("submitting");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) throw new Error("Subscription failed");
      writeFlag(SUBSCRIBED_KEY);
      setState("success");
      setEmail("");
    } catch {
      setState("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <dialog
        open
        aria-labelledby="newsletter-popup-title"
        className="relative m-0 w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-vb-ink p-0 shadow-2xl shadow-black/50"
        style={{ borderColor: `${theme.primaryBright}55` }}
      >
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: theme.primary }} />
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close newsletter signup"
          className="absolute right-4 top-4 rounded-full p-2 text-vb-muted transition hover:bg-white/10 hover:text-vb-silver-bright"
        >
          <X size={18} />
        </button>
        <div className="p-6 sm:p-8">
          <div
            className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: `${theme.primary}25`, color: theme.primaryBright }}
          >
            {state === "success" ? <Check size={24} /> : <Mail size={24} />}
          </div>
          {state === "success" ? (
            <div>
              <h2
                id="newsletter-popup-title"
                className="font-display text-3xl uppercase text-vb-silver-bright"
              >
                You're in.
              </h2>
              <p className="mt-3 max-w-md font-body text-vb-muted">{config.successMessage}</p>
              <button
                type="button"
                onClick={dismiss}
                className="mt-6 rounded-lg px-4 py-2.5 font-sub text-sm uppercase tracking-wider text-white transition hover:brightness-110"
                style={{ background: theme.primary }}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p
                className="font-sub text-xs uppercase tracking-[0.25em]"
                style={{ color: theme.primaryBright }}
              >
                Vylanous Beats / Private access
              </p>
              <h2
                id="newsletter-popup-title"
                className="mt-2 max-w-sm font-display text-4xl uppercase leading-none text-vb-silver-bright"
              >
                {config.title}
              </h2>
              <p className="mt-4 max-w-md font-body text-vb-muted">{config.body}</p>
              <form onSubmit={submit} className="mt-6 space-y-3">
                <label htmlFor="newsletter-popup-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-popup-email"
                  aria-label="Email address"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (state === "error") setState("idle");
                  }}
                  placeholder={config.placeholder}
                  className="w-full rounded-lg border border-white/10 bg-vb-black px-4 py-3 font-body text-sm text-vb-silver-bright outline-none transition placeholder:text-vb-muted/60 focus:border-vb-purple"
                />
                {state === "error" && (
                  <p className="font-body text-sm text-red-300" role="alert">
                    We couldn't save that email. Please try again.
                  </p>
                )}
                <label className="flex items-start gap-2 font-body text-xs leading-relaxed text-vb-muted">
                  <input
                    aria-label={config.consentText}
                    type="checkbox"
                    required
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-0.5 accent-vb-purple"
                  />
                  <span>{config.consentText}</span>
                </label>
                <button
                  type="submit"
                  disabled={state === "submitting"}
                  className="w-full rounded-lg px-4 py-3 font-sub text-sm uppercase tracking-wider text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
                  style={{ background: theme.primary }}
                >
                  {state === "submitting" ? "Joining…" : config.buttonLabel}
                </button>
              </form>
              <button
                type="button"
                onClick={dismiss}
                className="mt-4 w-full font-body text-xs text-vb-muted underline-offset-4 transition hover:text-vb-silver-bright hover:underline"
              >
                {config.dismissLabel}
              </button>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
