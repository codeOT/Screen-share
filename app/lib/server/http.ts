import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./accounts";

const MAX_AGE = 60 * 60 * 24 * 30;

export async function readSessionToken() {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export async function writeSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}
