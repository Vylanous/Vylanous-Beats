import { Link, useSearchParams } from "wouter";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const status = params.get("status");
  const success = status === "success";
  const expired = status === "invalid_or_expired";

  return (
    <main className="min-h-screen bg-vb-black px-5 py-20 text-vb-silver-bright sm:px-8">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-vb-ink p-8 text-center shadow-2xl shadow-vb-purple-deep/20 sm:p-12">
        <p className="font-sub text-xs uppercase tracking-[0.28em] text-vb-purple-bright">
          Vylanous Beats account
        </p>
        <h1 className="mt-4 font-display text-5xl uppercase text-chrome">
          {success ? "Email verified" : expired ? "Link expired" : "Verification problem"}
        </h1>
        <p className="mx-auto mt-5 max-w-md font-body leading-7 text-vb-silver/70">
          {success
            ? "Your account is verified. You can now browse the full catalog and purchase beats whenever you are ready."
            : expired
              ? "This verification link is invalid, expired, or has already been used. Sign in and request a new verification email."
              : "We could not complete that verification link. Sign in to your account and request a new verification email."}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={success ? "/beats" : "/login"}
            className="rounded-xl bg-vb-purple px-5 py-3 font-sub text-sm uppercase tracking-wide text-white transition hover:bg-vb-purple-bright"
          >
            {success ? "Browse the Beat Vault" : "Go to sign in"}
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-white/15 px-5 py-3 font-sub text-sm uppercase tracking-wide text-vb-silver transition hover:border-vb-purple hover:text-white"
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}

