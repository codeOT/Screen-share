import { findUserByEmail, saveResetToken, validEmail } from "../../../lib/server/accounts";
import { asString, jsonError, readJson } from "../../../lib/server/http";
import { sendResetEmail } from "../../../lib/server/mail";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  const email = asString(body?.email).trim().toLowerCase();
  if (!validEmail(email)) return jsonError("Enter a valid email.", 400);
  if (!process.env.RESEND_API_KEY) {
    return jsonError("Email is not set up. Add RESEND_API_KEY.", 503);
  }

  try {
    const user = await findUserByEmail(email);
    if (user) {
      const token = await saveResetToken(user._id);
      await sendResetEmail(user.email, token);
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[screnn] forgot", err);
    const message = err instanceof Error ? err.message : "Could not send the reset email.";
    if (message.startsWith("Email is not set up") || message.startsWith("The free Resend sender")) {
      return jsonError(message, 503);
    }
    return jsonError(/send|resend|email/i.test(message) ? message : "Could not reach the database.", 503);
  }
}
