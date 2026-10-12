import { replacePassword, userFromResetToken } from "../../../lib/server/accounts";
import { asString, jsonError, readJson } from "../../../lib/server/http";
import { mailError, sendPasswordChangedEmail } from "../../../lib/server/mail";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("This reset link is missing or no longer works.", 400);
  const token = asString(body.token);
  const password = asString(body.password);
  if (password.length < 8 || password.length > 200) return jsonError("Use at least 8 characters.", 400);

  try {
    const user = await userFromResetToken(token);
    if (!user) return jsonError("This reset link is missing or no longer works.", 400);
    await replacePassword(user._id, password);
    try {
      await sendPasswordChangedEmail(user.email, user.name);
    } catch (err) {
      mailError(err);
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[screnn] reset", err);
    return jsonError("Could not reach the database.", 503);
  }
}
