import { publicAccount, userFromToken } from "../../../lib/server/accounts";
import { jsonError, readSessionToken } from "../../../lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await userFromToken(await readSessionToken());
    if (!user) return jsonError("Sign in again.", 401);
    return Response.json(publicAccount(user));
  } catch (err) {
    console.error("[screnn] session", err);
    return jsonError("Could not reach the database.", 503);
  }
}
