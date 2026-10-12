export type Account = {
  name: string;
  email: string;
  sharesUsed: number;
};

export const FREE_SHARE_LIMIT = 3;

export function sharesLeft(account: Account | null) {
  return Math.max(0, FREE_SHARE_LIMIT - (account?.sharesUsed ?? 0));
}

async function request(path: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new Error("Could not reach the server.");
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string; name?: string; email?: string; sharesUsed?: number; ok?: boolean };
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function accountFrom(data: { name?: string; email?: string; sharesUsed?: number }): Account {
  return {
    name: data.name || "",
    email: data.email || "",
    sharesUsed: typeof data.sharesUsed === "number" ? data.sharesUsed : 0,
  };
}

export async function fetchSession(): Promise<Account | null> {
  let response: Response;
  try {
    response = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
  } catch {
    throw new Error("Could not reach the server.");
  }
  if (response.status === 401) return null;
  const data = (await response.json().catch(() => ({}))) as { error?: string; name?: string; email?: string; sharesUsed?: number };
  if (!response.ok) throw new Error(data.error || "Could not load your account.");
  return accountFrom(data);
}

export async function signUp(input: { name: string; email: string; password: string }) {
  return accountFrom(await request("/api/auth/sign-up", { method: "POST", body: JSON.stringify(input) }));
}

export async function signIn(input: { email: string; password: string }) {
  return accountFrom(await request("/api/auth/sign-in", { method: "POST", body: JSON.stringify(input) }));
}

export async function signOut() {
  await request("/api/auth/sign-out", { method: "POST" });
}

export async function requestPasswordReset(email: string) {
  await request("/api/auth/forgot", { method: "POST", body: JSON.stringify({ email }) });
}

export async function resetPassword(token: string, password: string) {
  await request("/api/auth/reset", { method: "POST", body: JSON.stringify({ token, password }) });
}

export async function updateAccount(input: { name: string; email: string; currentPassword: string; password?: string }) {
  return accountFrom(await request("/api/auth/settings", { method: "PATCH", body: JSON.stringify(input) }));
}

export async function recordShare() {
  const account = accountFrom(await request("/api/shares", { method: "POST" }));
  window.dispatchEvent(new Event("screnn-account"));
  return account;
}
