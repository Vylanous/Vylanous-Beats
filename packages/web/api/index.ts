// Deprecated — duplicate auth handler removed.
// The canonical admin auth lives in packages/web/src/api (lib/admin-auth.ts).
// Delete this file with: git rm packages/web/api/index.ts

export default async function handler(): Promise<Response> {
  return new Response(JSON.stringify({ error: "not_found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
