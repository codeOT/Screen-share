import { FREE_SHARE_LIMIT } from "../../lib/account";
import { publicAccount, useShare, userFromToken } from "../../lib/server/accounts";
import { jsonError, readSessionToken } from "../../lib/server/http";
import { mailError, sendShareLimitEmail } from "../../lib/server/mail";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await userFromToken(await readSessionToken());
    if (!user) return jsonError("Sign in again.", 401);
    const saved = await useShare(user._id);
    if (!saved) return jsonError("The free plan includes 3 shares.", 403);
    if (saved.sharesUsed >= FREE_SHARE_LIMIT) {
      try {
        await sendShareLimitEmail(saved.email, saved.name);
      } catch (err) {
        mailError(err);
      }
    }
    return Response.json(publicAccount(saved));
  } catch (err) {
    console.error("[screnn] share", err);
    return jsonError("Could not reach the database.", 503);
  }
}
