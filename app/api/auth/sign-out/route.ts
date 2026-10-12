import { closeSession } from "../../../lib/server/accounts";
import { clearSessionCookie, jsonError, readSessionToken } from "../../../lib/server/http";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await closeSession(await readSessionToken());
    await clearSessionCookie();
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[screnn] sign-out", err);
    await clearSessionCookie().catch(() => {});
    return jsonError("Could not reach the database.", 503);
  }
}
