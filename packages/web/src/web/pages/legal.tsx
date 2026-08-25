import { Layout } from "../components/layout";

type LegalDocumentProps = {
  title: string;
  updated: string;
  children: React.ReactNode;
};

function LegalDocument({ title, updated, children }: LegalDocumentProps) {
  return (
    <Layout>
      <article className="mx-auto w-full max-w-3xl px-5 py-14 font-body text-vb-silver sm:px-8">
        <p className="font-sub uppercase tracking-[0.2em] text-vb-purple-bright">Vylanous Beats</p>
        <h1 className="mt-3 font-display text-5xl uppercase tracking-wide text-chrome sm:text-6xl">
          {title}
        </h1>
        <p className="mt-4 text-sm text-vb-muted">Last updated: {updated}</p>
        <aside className="mt-8 rounded-xl border border-amber-300/35 bg-amber-300/[0.08] p-4 text-sm text-amber-50">
          This working document reflects the site’s current product and data flows. It must be
          reviewed and approved by a qualified lawyer before reliance for a public launch or
          jurisdiction-specific use.
        </aside>
        <div className="mt-10 space-y-9 leading-7 text-vb-silver/85">{children}</div>
      </article>
    </Layout>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl uppercase tracking-wide text-chrome">{heading}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Notice" updated="August 25, 2026">
      <Section heading="Scope">
        <p>
          This notice explains how Vylanous Beats handles information collected through its website,
          customer account, checkout, download, support, and newsletter features.
        </p>
      </Section>
      <Section heading="Information collected">
        <p>
          The service may collect the email address, display name, encrypted password credential,
          account verification state, marketing preference, order history, licensed-item records,
          and download entitlement information needed to provide the customer portal and purchases.
          Newsletter forms collect the submitted email address. Support messages and
          delivery-provider events may contain the sender, recipient, subject, and delivery status
          necessary to operate support and email delivery.
        </p>
      </Section>
      <Section heading="How information is used">
        <p>
          Information is used to authenticate accounts, process and fulfil beat-license orders,
          authorize downloads, send verification and delivery messages, respond to support requests,
          maintain service security, and send marketing messages where a visitor has opted in.
          Aggregated interaction metrics are used to understand Published Beats block clicks and
          plays; they are presented as interactions, not unique-visitor counts.
        </p>
      </Section>
      <Section heading="Service providers and payments">
        <p>
          Payments are processed by Stripe. Email delivery is handled through Resend, and uploaded
          media and files are stored through the configured object-storage provider. Those providers
          process information under their own terms and privacy notices. Payment-card details are
          handled by Stripe and are not stored by this website’s application database.
        </p>
      </Section>
      <Section heading="Retention, choices, and requests">
        <p>
          Account, order, and entitlement records are retained while needed to provide the service,
          resolve support matters, meet legal obligations, and protect against fraud. Marketing
          preferences can be changed in the customer dashboard where available. To request access,
          correction, deletion, or help with a privacy concern, contact{" "}
          <a className="text-vb-purple-bright underline" href="mailto:support@vylanous.com">
            support@vylanous.com
          </a>
          .
        </p>
      </Section>
    </LegalDocument>
  );
}

export function TermsPage() {
  return (
    <LegalDocument title="Terms of Use" updated="August 25, 2026">
      <Section heading="Service and accounts">
        <p>
          Vylanous Beats offers music-beat discovery, licensing, customer accounts, and delivery
          tools. You are responsible for providing accurate account information, protecting your
          sign-in credentials, and using the service only for lawful purposes.
        </p>
      </Section>
      <Section heading="Licenses and purchases">
        <p>
          Each beat purchase is governed by the selected license tier and any license terms
          presented with that purchase. Availability, including exclusive licensing, can change
          before checkout completes. A paid order does not transfer rights beyond the license
          purchased.
        </p>
      </Section>
      <Section heading="Payments and delivery">
        <p>
          Checkout is processed by Stripe. After successful payment, the service provides the
          applicable entitlement and download access. If a delivery or download issue occurs,
          contact support with a non-sensitive order reference so the team can investigate safely.
        </p>
      </Section>
      <Section heading="Acceptable use">
        <p>
          You must not interfere with the service, bypass access controls, submit fraudulent payment
          activity, attempt to access another person’s account or downloads, or use site content
          beyond the permissions granted by the applicable license.
        </p>
      </Section>
      <Section heading="Contact and review">
        <p>
          Questions about these terms, a license, or an order can be sent to{" "}
          <a className="text-vb-purple-bright underline" href="mailto:support@vylanous.com">
            support@vylanous.com
          </a>
          . These working terms require legal review before public reliance.
        </p>
      </Section>
    </LegalDocument>
  );
}
