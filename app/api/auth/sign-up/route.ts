import {
  createUser,
  openSession,
  publicAccount,
  validEmail,
} from "../../../lib/server/accounts";
import { asString, jsonError, readJson, writeSessionCookie } from "../../../lib/server/http";
import { mailError, sendWelcomeEmail } from "../../../lib/server/mail";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("Enter your name, email, and password.", 400);
  const name = asString(body.name).trim();
  const email = asString(body.email).trim().toLowerCase();
  const password = asString(body.password);
  if (!name || name.length > 80) return jsonError("Enter your name.", 400);
  if (!validEmail(email)) return jsonError("Enter a valid email.", 400);
  if (password.length < 8 || password.length > 200) return jsonError("Use at least 8 characters.", 400);

  try {
    const user = await createUser(name, email, password);
    if (!user) return jsonError("An account with that email already exists.", 409);
    await writeSessionCookie(await openSession(user._id));
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (err) {
      mailError(err);
    }
    return Response.json(publicAccount(user));
  } catch (err) {
    console.error("[screnn] sign-up", err);
    return jsonError("Could not reach the database.", 503);
  }
}
