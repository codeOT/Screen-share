"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Brand } from "./screens";
import { fetchSession, signOut, type Account } from "../lib/account";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/billing", label: "Billing & Invoices" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export function DashboardShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: (account: Account) => ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [account, setAccount] = useState<Account | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        const saved = await fetchSession();
        if (cancel) return;
        if (!saved) {
          router.replace("/sign-in");
          return;
        }
        setAccount(saved);
        setProblem("");
      } catch (err) {
        if (!cancel) setProblem(err instanceof Error ? err.message : "Could not load your account.");
      }
    }
    void load();
    window.addEventListener("screnn-account", load);
    return () => {
      cancel = true;
      window.removeEventListener("screnn-account", load);
    };
  }, [router, pathname]);

  async function leave() {
    await signOut();
    router.push("/");
  }

  if (problem) {
    return <main className="min-h-screen bg-paper px-6 py-16 text-sm text-ink">{problem}</main>;
  }

  if (!account) {
    return <main className="min-h-screen bg-paper" />;
  }

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <Sidebar account={account} pathname={pathname} onSignOut={leave} className="sticky top-0 hidden h-screen lg:flex" />
      {menuOpen ? (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <Sidebar
            account={account}
            pathname={pathname}
            onSignOut={leave}
            className="relative flex h-full w-[min(280px,86vw)]"
            onNavigate={() => setMenuOpen(false)}
          />
          <button type="button" aria-label="Close menu" className="h-full min-w-0 flex-1 bg-ink/30" onClick={() => setMenuOpen(false)} />
        </div>
      ) : null}

      <div className="min-w-0">
        <header className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="dashboard-menu"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full text-ink lg:hidden"
            >
              <MenuIcon />
            </button>
            <div>
              <p className="text-sm text-muted">Dashboard</p>
              <h1 className="text-lg font-semibold tracking-tight text-ink">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="sign-out"
              onClick={leave}
              className="rounded-full border border-ink/10 bg-white px-4 py-2.5 text-sm font-medium text-ink"
            >
              Sign out
            </button>
            {action}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children(account)}</main>
      </div>
    </div>
  );
}

function Sidebar({
  account,
  pathname,
  onSignOut,
  className,
  onNavigate,
}: {
  account: Account;
  pathname: string;
  onSignOut: () => void;
  className: string;
  onNavigate?: () => void;
}) {
  return (
    <aside className={`${className} flex-col border-r border-black/5 bg-white`}>
      <div className="px-5 py-5">
        <a href="/" onClick={onNavigate}>
          <Brand />
        </a>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {nav.map((item) => {
          const current = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              onClick={onNavigate}
              className={
                current
                  ? "rounded-xl bg-ink px-3 py-2.5 text-sm font-medium text-white"
                  : "rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-paper hover:text-ink"
              }
            >
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="border-t border-black/5 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">
            {initials(account.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{account.name}</p>
            <p className="truncate text-xs text-muted">{account.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-4 w-full rounded-full border border-ink/10 px-4 py-2 text-sm font-medium text-ink"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

function initials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "S";
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
