import { passwordMatches, publicAccount, updateUser, userFromToken } from "../../../lib/server/accounts";
import { asString, jsonError, readJson, readSessionToken } from "../../../lib/server/http";
import { mailError, sendPasswordChangedEmail } from "../../../lib/server/mail";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("Enter your name and current password.", 400);
  const name = asString(body.name).trim();
  const currentPassword = asString(body.currentPassword);
  const nextPassword = asString(body.password);
  if (!name || name.length > 80) return jsonError("Enter your name.", 400);
  if (!currentPassword) return jsonError("Enter your current password.", 400);
  if (nextPassword && (nextPassword.length < 8 || nextPassword.length > 200)) {
    return jsonError("Use at least 8 characters for the new password.", 400);
  }

  try {
    const user = await userFromToken(await readSessionToken());
    if (!user) return jsonError("Sign in again.", 401);
    if (!(await passwordMatches(currentPassword, user.passwordSalt, user.passwordHash))) {
      return jsonError("That current password doesn't match.", 401);
    }
    const saved = await updateUser(user._id, name, user.email, nextPassword || undefined);
    if (!saved) return jsonError("Could not save your account.", 409);
    try {
      if (nextPassword) await sendPasswordChangedEmail(saved.email, saved.name);
    } catch (err) {
      mailError(err);
    }
    return Response.json(publicAccount(saved));
  } catch (err) {
    console.error("[screnn] settings", err);
    return jsonError("Could not reach the database.", 503);
  }
}
