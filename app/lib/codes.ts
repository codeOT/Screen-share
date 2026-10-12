export const CODE_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

export function normalizeCode(value: string) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "")
    .slice(0, 6);
}

export function countLabel(count: number) {
  if (count === 0) return "No one has joined yet";
  if (count === 1) return "1 person watching";
  return `${count} people watching`;
}
