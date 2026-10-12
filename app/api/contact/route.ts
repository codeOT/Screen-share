import { validEmail } from "../../lib/server/accounts";
import { asString, jsonError, readJson } from "../../lib/server/http";
import { sendContactEmail } from "../../lib/server/mail";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("Enter your name, email, and a message.", 400);
  const name = asString(body.name).trim();
  const email = asString(body.email).trim().toLowerCase();
  const message = asString(body.message).trim();
  if (!name || name.length > 80) return jsonError("Enter your name.", 400);
  if (!validEmail(email)) return jsonError("Enter a valid email.", 400);
  if (!message || message.length > 4000) return jsonError("Enter a message.", 400);

  try {
    await sendContactEmail({ name, email, message });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[screnn] contact", err);
    const text = err instanceof Error ? err.message : "Could not send the message.";
    if (text.startsWith("Contact email is not set up") || text.startsWith("Email is not set up") || text.startsWith("The free Resend sender")) {
      return jsonError(text, 503);
    }
    return jsonError(/send|resend|email/i.test(text) ? text : "Could not send the message.", 503);
  }
}
