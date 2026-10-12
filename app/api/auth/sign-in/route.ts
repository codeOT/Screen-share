import { findUserByEmail, openSession, passwordMatches, publicAccount, validEmail } from "../../../lib/server/accounts";
import { asString, jsonError, readJson, writeSessionCookie } from "../../../lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("Enter your email and password.", 400);
  const email = asString(body.email).trim().toLowerCase();
  const password = asString(body.password);
  if (!validEmail(email) || !password) return jsonError("That email and password don't match.", 400);

  try {
    const user = await findUserByEmail(email);
    if (!user || !(await passwordMatches(password, user.passwordSalt, user.passwordHash))) {
      return jsonError("That email and password don't match.", 401);
    }
    await writeSessionCookie(await openSession(user._id));
    return Response.json(publicAccount(user));
  } catch (err) {
    console.error("[screnn] sign-in", err);
    return jsonError("Could not reach the database.", 503);
  }
}
