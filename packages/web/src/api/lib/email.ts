import { appUrl } from "./util";

function emailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set; cannot send email");
  if (!from) throw new Error("EMAIL_FROM is not set; configure a verified sender address");
  return { apiKey, from };
}

export async function sendDeliveryEmail(email: string, orderId: string, token: string) {
  const base = appUrl();
  const link = `${base}/success?order=${orderId}&token=${token}`;
  const { apiKey, from } = emailConfig();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from,
      to: [email],
      headers: { "Idempotency-Key": `beat-delivery/${orderId}` },
      subject: "Your Vylanous Beats download is ready",
      html: `<div style="font-family:sans-serif;background:#0a0a0c;color:#edeef2;padding:32px;border-radius:12px"><h1 style="color:#a24df5;letter-spacing:1px">VYLANOUS BEATS</h1><p>Thanks for your purchase. Your beats are ready to download.</p><p><a href="${link}" style="background:#7c2fcb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Download your beats</a></p><p style="color:#7a7c88;font-size:13px">Order ${orderId}. Keep this email — your download link is private.</p></div>`,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`resend email failed ${res.status}: ${detail}`);
  }
}

/** Sends only to Resend's documented safe test recipient; never use for customer delivery. */
export async function sendSafeTestEmail() {
  const { apiKey, from } = emailConfig();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Idempotency-Key": `vylanous-delivery-test/${Date.now()}`,
    },
    body: JSON.stringify({
      from,
      to: ["delivered+vylanous-admin@resend.dev"],
      subject: "Vylanous Beats email service verification",
      text: "This is a safe Resend delivery verification. No customer received this message.",
    }),
  });
  if (!res.ok) throw new Error(`resend test email failed ${res.status}: ${await res.text()}`);
  return (await res.json()) as { id?: string };
}
