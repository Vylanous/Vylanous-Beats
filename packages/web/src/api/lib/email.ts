import { appUrl } from "./util";

export async function sendDeliveryEmail(email: string, orderId: string, token: string) {
  const base = appUrl();
  const link = `${base}/success?order=${orderId}&token=${token}`;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set; cannot send delivery email");
  const from = process.env.EMAIL_FROM || "Vylanous Beats <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from, to: [email], subject: "Your Vylanous Beats download is ready",
      html: `<div style="font-family:sans-serif;background:#0a0a0c;color:#edeef2;padding:32px;border-radius:12px"><h1 style="color:#a24df5;letter-spacing:1px">VYLANOUS BEATS</h1><p>Thanks for your purchase. Your beats are ready to download.</p><p><a href="${link}" style="background:#7c2fcb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Download your beats</a></p><p style="color:#7a7c88;font-size:13px">Order ${orderId}. Keep this email — your download link is private.</p></div>`,
    }),
  });
  if (!res.ok) { const detail = await res.text().catch(() => ""); throw new Error(`resend email failed ${res.status}: ${detail}`); }
}
