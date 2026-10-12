"use client";

import { useEffect, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { fetchSession, signOut } from "../lib/account";
import { countLabel } from "../lib/codes";

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[15px] font-medium text-white shadow-[0_1px_1px_rgba(0,0,0,0.16),0_8px_20px_rgba(20,20,20,0.12)] transition hover:bg-ink/90 disabled:cursor-wait disabled:opacity-60";
const ghostBtn =
  "inline-flex items-center justify-center rounded-full border border-ink/10 bg-white px-5 py-3 text-[15px] font-medium text-ink transition hover:border-ink/25 disabled:cursor-wait disabled:opacity-60";
const dangerBtn =
  "rounded-full bg-danger px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110";

function Mark() {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-paper">
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 19.5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Brand({ onClick }: { onClick?: () => void }) {
  const inner = (
    <>
      <Mark />
      <span className="text-[15px] font-semibold tracking-tight">Screnn</span>
    </>
  );
  const className = "inline-flex items-center gap-2 text-ink";
  if (!onClick) return <p className={className}>{inner}</p>;
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

export function Status({ status, bad }: { status: string; bad: boolean }) {
  if (!status) return null;
  return (
    <p
      data-testid="alert"
      role={bad ? "alert" : "status"}
      className={
        bad
          ? "mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          : "mt-4 text-sm text-muted"
      }
    >
      {status}
    </p>
  );
}

const steps = [
  ["01", "Share", "Pick a screen, a window, or a browser tab."],
  ["02", "Send the code", "Read six characters, or copy a link."],
  ["03", "They watch", "The screen shows up live in their browser."],
] as const;

const faqs = [
  [
    "Do viewers need an account?",
    "No. They type the six-character code and watch. An account is for the person sharing.",
  ],
  [
    "Does each person get a different code?",
    "No. One share has one code, and everyone watching uses it. The next time you share, you get a new code.",
  ],
  [
    "How many people can be in a room?",
    "Free includes 3 shares. Each share is up to 3 people and lasts 1 hour. Plus is 8 people with no time limit. Premium has no set viewer limit and no time limit. A live share today stops at 8 viewers.",
  ],
  [
    "Does anyone have to install an app?",
    "No. The host picks a screen, window, or tab in the browser. Viewers only need the code.",
  ],
  [
    "Is the screen recorded?",
    "No. The picture stays between the browsers. When you stop sharing, the code stops working.",
  ],
  [
    "What if the room is full?",
    "The next person sees that the room is full. You can move to a larger plan when you need more seats.",
  ],
] as const;

const plans = [
  {
    id: "free",
    name: "Free",
    monthlyCents: 0,
    people: "Up to 3 people",
    detail: "You, plus 2 viewers.",
    points: ["3 shares", "1 hour per share", "No card required"],
  },
  {
    id: "plus",
    name: "Plus",
    monthlyCents: 699,
    people: "Up to 8 people",
    detail: "You, plus 7 viewers.",
    points: ["No time limit", "Viewers join free", "Cancel anytime"],
  },
  {
    id: "premium",
    name: "Premium",
    monthlyCents: 1599,
    people: "Unlimited viewers",
    detail: "Anyone with the code can watch.",
    points: ["No time limit", "Viewers join free", "Cancel anytime"],
  },
] as const;

function planPrice(monthlyCents: number, yearly: boolean) {
  const billedCents = yearly ? monthlyCents * 10 : monthlyCents;
  const shownCents = yearly ? Math.round(billedCents / 12) : monthlyCents;
  const shown = (shownCents / 100).toFixed(2);
  const billed = (billedCents / 100).toFixed(2);
  return { shown, billed };
}

function AccountNavLink({
  className = "hover:text-ink",
  onNavigate,
  accountLinks = true,
}: {
  className?: string;
  onNavigate?: () => void;
  accountLinks?: boolean;
}) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let cancel = false;
    fetchSession()
      .then((account) => {
        if (!cancel) setSignedIn(Boolean(account));
      })
      .catch(() => {
        if (!cancel) setSignedIn(false);
      });
    return () => {
      cancel = true;
    };
  }, []);
  if (!signedIn) {
    return (
      <a href="/sign-in" className={className} onClick={onNavigate}>
        Sign in
      </a>
    );
  }
  if (!accountLinks) return null;
  return (
    <>
      <a href="/dashboard" className={className} onClick={onNavigate}>
        Dashboard
      </a>
      <button
        type="button"
        className={className}
        onClick={() => {
          onNavigate?.();
          void signOut().finally(() => router.push("/"));
        }}
      >
        Sign out
      </button>
    </>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SiteFooter({ onJoin, links = false }: { onJoin?: () => void; links?: boolean }) {
  const howHref = onJoin ? "#how" : "/#how";
  const shareHref = onJoin ? "#share" : "/#share";
  const showLinks = Boolean(onJoin) || links;
  return (
    <footer className="border-t border-black/5">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[15px] font-semibold tracking-tight">Screnn</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
            Share a screen with a short code. Viewers watch in the browser.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 text-sm text-muted sm:items-end">
          {showLinks ? (
            <>
              <a href={howHref} className="hover:text-ink">
                How it works
              </a>
              <a href="/pricing" className="hover:text-ink">
                Pricing
              </a>
              <a href="/faq" className="hover:text-ink">
                FAQ
              </a>
              <a href="/contact" className="hover:text-ink">
                Contact
              </a>
              {onJoin ? (
                <button type="button" onClick={onJoin} className="text-left hover:text-ink sm:text-right">
                  Join with a code
                </button>
              ) : (
                <a href="/?join=1" className="text-left hover:text-ink sm:text-right">
                  Join with a code
                </a>
              )}
              <a href={shareHref} className="hover:text-ink">
                Share a screen
              </a>
              <AccountNavLink accountLinks={false} className="text-left hover:text-ink sm:text-right" />
            </>
          ) : (
            <p className="max-w-xs sm:text-right">Open a code from the host to watch a live screen.</p>
          )}
        </div>
      </div>
      <p className="px-6 pb-8 text-center text-xs text-muted">© 2026 Screnn. The video stays between browsers.</p>
    </footer>
  );
}

export function SiteHeader({ onJoin }: { onJoin?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const howHref = onJoin ? "#how" : "/#how";

  function closeMenu() {
    setMenuOpen(false);
  }

  function brand() {
    if (onJoin) return <Brand />;
    return (
      <a href="/">
        <Brand />
      </a>
    );
  }

  return (
    <>
      <header className="relative z-30 px-6 pt-7">
        <div className="flex items-center justify-between sm:hidden">
          {brand()}
          <button
            type="button"
            data-testid="menu-button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-full text-ink"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
        <nav className="hidden flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm text-muted sm:flex">
          {brand()}
          <a href={howHref} className="hover:text-ink">
            How it works
          </a>
          <a href="/pricing" className="hover:text-ink">
            Pricing
          </a>
          <a href="/faq" className="hover:text-ink">
            FAQ
          </a>
          <a href="/contact" className="hover:text-ink">
            Contact
          </a>
          <AccountNavLink />
        </nav>
      </header>
      {menuOpen ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-paper px-6 pt-7 sm:hidden">
          <div className="flex items-center justify-between">
            {brand()}
            <button
              type="button"
              aria-label="Close menu"
              onClick={closeMenu}
              className="grid h-10 w-10 place-items-center rounded-full text-ink"
            >
              <CloseIcon />
            </button>
          </div>
          <nav className="mt-14 flex flex-col items-start gap-7 text-3xl font-semibold tracking-tight text-ink">
            <a href={howHref} onClick={closeMenu}>
              How it works
            </a>
            <a href="/pricing" onClick={closeMenu}>
              Pricing
            </a>
            <a href="/faq" onClick={closeMenu}>
              FAQ
            </a>
            <a href="/contact" onClick={closeMenu}>
              Contact
            </a>
            <AccountNavLink className="font-semibold" onNavigate={closeMenu} />
          </nav>
        </div>
      ) : null}
    </>
  );
}

export function PricingSection({
  onChoose,
  busy = false,
  page = false,
}: {
  onChoose?: () => void;
  busy?: boolean;
  page?: boolean;
}) {
  const [yearly, setYearly] = useState(false);
  const Heading = page ? "h1" : "h2";
  return (
    <section id={page ? undefined : "pricing"} className={page ? undefined : "scroll-mt-8"}>
      <div className={`mx-auto max-w-6xl px-6 ${page ? "pb-20 pt-12 sm:pt-16" : "pb-20"}`}>
        <Heading className="text-center text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">Pricing</Heading>
        <p className="mx-auto mt-3 max-w-md text-center text-base leading-relaxed text-muted">
          Monthly or yearly. Viewers join free with your code.
        </p>
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full bg-white p-1 text-sm font-medium">
            <button
              type="button"
              aria-pressed={!yearly}
              onClick={() => setYearly(false)}
              className={!yearly ? "rounded-full bg-ink px-4 py-2 text-white" : "rounded-full px-4 py-2 text-muted"}
            >
              Monthly
            </button>
            <button
              type="button"
              aria-pressed={yearly}
              onClick={() => setYearly(true)}
              className={yearly ? "rounded-full bg-ink px-4 py-2 text-white" : "rounded-full px-4 py-2 text-muted"}
            >
              Annual
              <span className={yearly ? "ml-2 text-white/70" : "ml-2 text-muted"}>2 months free</span>
            </button>
          </div>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const featured = plan.id === "premium";
            const free = plan.monthlyCents === 0;
            const price = planPrice(plan.monthlyCents, yearly);
            const muted = featured ? "text-white/60" : "text-muted";
            return (
              <article
                key={plan.id}
                className={
                  featured
                    ? "flex h-full flex-col rounded-[28px] bg-ink p-7 text-white shadow-[0_20px_50px_rgba(20,20,20,0.16)] sm:p-8"
                    : "flex h-full flex-col rounded-[28px] bg-white p-7 text-ink shadow-[0_12px_40px_rgba(20,20,20,0.05)] sm:p-8"
                }
              >
                <p className={`text-sm font-medium ${muted}`}>{plan.name}</p>
                <p className="mt-6 flex items-baseline gap-1.5 tracking-[-0.04em]">
                  <span className="text-2xl font-semibold">$</span>
                  <span className="text-6xl font-semibold leading-none">{free ? "0" : price.shown}</span>
                  {free ? null : <span className={`text-sm font-medium ${muted}`}>/ month</span>}
                </p>
                <p className={`mt-4 min-h-5 text-sm ${muted}`}>
                  {free ? "3 shares, 1 hour each" : yearly ? `$${price.billed} billed yearly` : "Billed monthly"}
                </p>
                <div className={`mt-8 border-t pt-6 ${featured ? "border-white/15" : "border-black/10"}`}>
                  <p className="text-lg font-semibold tracking-tight">{plan.people}</p>
                  <p className={`mt-2 text-sm leading-relaxed ${muted}`}>{plan.detail}</p>
                </div>
                <ul className="mt-6 flex flex-col gap-3.5 text-sm">
                  {plan.points.map((point) => (
                    <li key={point} className={`flex items-start gap-3 leading-6 ${featured ? "text-white/80" : "text-muted"}`}>
                      <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${featured ? "bg-white/70" : "bg-ink/35"}`} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {page ? (
                    <a
                      href="/#share"
                      className={
                        featured
                          ? "inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3.5 text-[15px] font-medium text-ink transition hover:bg-white/90"
                          : `${primaryBtn} w-full`
                      }
                    >
                      {free ? "Start free" : `Choose ${plan.name}`}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={
                        featured
                          ? "inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3.5 text-[15px] font-medium text-ink transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-60"
                          : `${primaryBtn} w-full`
                      }
                      onClick={onChoose}
                      disabled={busy}
                    >
                      {busy ? "Starting…" : free ? "Start free" : `Choose ${plan.name}`}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ page = false }: { page?: boolean }) {
  const Heading = page ? "h1" : "h2";
  return (
    <section id={page ? undefined : "faq"} className={page ? undefined : "scroll-mt-8"}>
      <div className={`mx-auto max-w-3xl px-6 ${page ? "pb-20 pt-12 sm:pt-16" : "py-20"}`}>
        <Heading className="text-center text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">FAQ</Heading>
        <p className="mx-auto mt-3 max-w-md text-center text-base leading-relaxed text-muted">
          The short version of how a share works.
        </p>
        <div className="mt-12 flex flex-col gap-3">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group rounded-[28px] bg-white px-6 py-5 sm:px-8 sm:py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold tracking-tight text-ink [&::-webkit-details-marker]:hidden">
                {question}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper text-xl font-medium text-muted transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-xl pr-10 text-sm leading-7 text-muted">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductFrame() {
  return (
    <div className="rounded-t-[28px] bg-[#1c1c1c] p-2.5 pb-0 shadow-[0_30px_80px_rgba(50,40,30,0.16)] sm:rounded-t-[36px] sm:p-3.5 sm:pb-0">
      <div className="overflow-hidden rounded-t-[18px] bg-[#f7f4ef] sm:rounded-t-[22px]">
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#d0c9bf]" />
            <span className="h-2 w-2 rounded-full bg-[#d0c9bf]" />
            <span className="h-2 w-2 rounded-full bg-[#d0c9bf]" />
          </div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted">K7M2QP</p>
          <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-white">Live</span>
        </div>
        <div className="grid min-h-[460px] sm:grid-cols-[148px_minmax(0,1fr)_196px]">
          <aside className="hidden border-r border-black/5 p-4 sm:block">
            <p className="text-[11px] font-medium text-muted">Watching</p>
            <div className="mt-3 space-y-2">
              {["Ada", "Jonah", "Priya"].map((name) => (
                <div key={name} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                  <span className="h-6 w-6 rounded-full bg-[#e7e0d6]" />
                  <span className="text-xs text-ink">{name}</span>
                </div>
              ))}
            </div>
          </aside>
          <div className="p-5">
            <div className="h-full rounded-2xl border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(40,30,20,0.04)]">
              <div className="h-2.5 w-24 rounded-full bg-ink/10" />
              <div className="mt-3 h-2.5 w-40 rounded-full bg-ink/10" />
              <div className="mt-8 grid grid-cols-3 gap-3">
                <div className="h-24 rounded-xl bg-[#f3ece3]" />
                <div className="h-24 rounded-xl bg-[#efe4d4]" />
                <div className="h-24 rounded-xl bg-[#e7d3c0]" />
              </div>
              <div className="mt-4 h-2.5 w-full rounded-full bg-ink/5" />
              <div className="mt-2 h-2.5 w-4/5 rounded-full bg-ink/5" />
            </div>
          </div>
          <aside className="hidden bg-[#161616] p-4 text-white sm:block">
            <p className="text-[11px] font-medium text-white/50">Room</p>
            <p className="mt-4 font-mono text-2xl tracking-[0.18em]">K7M2QP</p>
            <p className="mt-3 text-xs leading-relaxed text-white/55">Anyone with this code can watch until you stop.</p>
            <div className="mt-6 space-y-2">
              <div className="h-8 rounded-lg bg-white/10" />
              <div className="h-8 rounded-lg bg-white/5" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function HomeScreen({
  onShare,
  onJoin,
  busy,
  status,
  statusBad,
}: {
  onShare: () => void;
  onJoin: () => void;
  busy: boolean;
  status: string;
  statusBad: boolean;
}) {
  return (
    <div className="bg-paper">
      <section id="share" className="relative flex min-h-svh flex-col overflow-hidden">
        <SiteHeader onJoin={onJoin} />

        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 pb-[calc(36vh+3.5rem)] pt-10 text-center sm:pb-[calc(40vh+4rem)]">
          <h1 className="text-[2.65rem] font-semibold leading-[1.02] tracking-[-0.045em] text-ink sm:text-7xl">
            Your screen,
            <span className="block">ready to share.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
            A short code is the invitation. They watch it live in the browser.
          </p>
          <button type="button" className={`${primaryBtn} mt-8`} data-testid="share-button" onClick={onShare} disabled={busy}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <rect x="3" y="4" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {busy ? "Starting…" : "Share my screen"}
          </button>
          <p className="mt-4 text-sm text-muted">
            No download ·{" "}
            <button type="button" data-testid="join-button" onClick={onJoin} className="font-medium text-ink hover:underline">
              Join with a code
            </button>
          </p>
          <Status status={status} bad={statusBad} />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[36vh] overflow-hidden sm:h-[40vh]">
          <div className="mx-auto w-[min(1080px,94vw)]">
            <ProductFrame />
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-8">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">How it works</h2>
          <ol className="mt-10 grid list-none gap-4 p-0 md:grid-cols-3">
            {steps.map(([number, title, text]) => (
              <li key={number} className="rounded-3xl bg-white p-6">
                <span className="text-sm text-muted">{number}</span>
                <p className="mt-3 text-lg font-semibold tracking-tight text-ink">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <PricingSection onChoose={onShare} busy={busy} />
      <FaqSection />

      <SiteFooter onJoin={onJoin} />
    </div>
  );
}

export function JoinScreen({
  value,
  onChange,
  onSubmit,
  onBack,
  busy,
  status,
  statusBad,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onBack: () => void;
  busy: boolean;
  status: string;
  statusBad: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6">
        <header className="py-6">
          <Brand onClick={onBack} />
        </header>
        <form
          className="mt-6 rounded-[28px] border border-line bg-raise p-6 sm:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(value);
          }}
        >
          <h1 className="font-serif text-5xl tracking-tight text-ink">Join a share</h1>
          <p className="mt-3 text-muted">Enter the code from the person sharing their screen.</p>
          <label htmlFor="code-input" className="mt-8 block text-sm text-muted">
            Room code
          </label>
          <input
            id="code-input"
            data-testid="code-input"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            maxLength={12}
            placeholder="AB23CD"
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-4 text-center font-mono text-3xl tracking-[0.35em] text-ink uppercase outline-none placeholder:tracking-[0.2em] placeholder:text-line"
          />
          <p className="mt-3 text-sm text-muted">Codes skip 0, 1, I, and O, so they are easier to read aloud.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" className={primaryBtn} data-testid="watch-button" disabled={busy}>
              {busy ? "Joining…" : "Watch"}
            </button>
            <button type="button" className={ghostBtn} onClick={onBack}>
              Back
            </button>
          </div>
          <Status status={status} bad={statusBad} />
        </form>
      </div>
      <SiteFooter />
    </div>
  );
}

export function HostScreen({
  code,
  viewerCount,
  localVideoRef,
  onStop,
  onSignOut,
  status,
  statusBad,
}: {
  code: string;
  viewerCount: number;
  localVideoRef: RefObject<HTMLVideoElement | null>;
  onStop: () => void;
  onSignOut?: () => void;
  status: string;
  statusBad: boolean;
}) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [linkLabel, setLinkLabel] = useState("");

  useEffect(() => {
    setLinkLabel(`${window.location.host}/?code=${code}`);
  }, [code]);

  async function copy(key: "code" | "link", text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(key);
    window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1600);
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="mx-auto w-full max-w-6xl flex-1 px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div className="flex items-center gap-4">
          <Brand />
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="live-dot inline-block h-2 w-2 rounded-full bg-danger" />
            Live
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p data-testid="viewer-count" aria-live="polite" className="text-sm text-muted">
            {countLabel(viewerCount)}
          </p>
          {onSignOut ? (
            <button type="button" data-testid="sign-out" onClick={onSignOut} className={ghostBtn}>
              Sign out
            </button>
          ) : null}
          <button type="button" className={dangerBtn} data-testid="stop-button" onClick={onStop}>
            Stop sharing
          </button>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <div className="lg:order-none">
          <div className="overflow-hidden rounded-2xl border border-line bg-black">
            <video
              ref={localVideoRef}
              data-testid="local-video"
              autoPlay
              playsInline
              muted
              className="aspect-video w-full bg-black object-contain"
            />
          </div>
          <p className="px-1 py-3 text-sm text-muted">Preview. This is what viewers see.</p>
        </div>

        <section className="order-first rounded-2xl border border-line bg-raise p-5 lg:order-none">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Room code</p>
          <div data-testid="room-code" className="mt-3 flex flex-wrap gap-2">
            {code.split("").map((char, index) => (
              <span
                key={`${char}-${index}`}
                className="grid h-16 min-w-12 flex-1 place-items-center rounded-xl border border-line bg-white font-mono text-3xl text-ink shadow-[0_8px_18px_rgba(28,25,23,0.06)]"
              >
                {char}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Anyone with this code can see the screen you picked, until you stop.
          </p>
          <p className="mt-3 break-all font-mono text-sm text-ink">{linkLabel}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className={primaryBtn} onClick={() => copy("code", code)}>
              {copied === "code" ? "Copied" : "Copy code"}
            </button>
            <button
              type="button"
              className={ghostBtn}
              onClick={() => copy("link", `${window.location.origin}/?code=${code}`)}
            >
              {copied === "link" ? "Copied" : "Copy link"}
            </button>
          </div>
          <Status status={status} bad={statusBad} />
        </section>
      </div>
      </div>
      <SiteFooter />
    </div>
  );
}

export function WatchScreen({
  code,
  remoteVideoRef,
  waiting,
  soundLocked,
  onSound,
  onLeave,
  status,
  statusBad,
}: {
  code: string;
  remoteVideoRef: RefObject<HTMLVideoElement | null>;
  waiting: boolean;
  soundLocked: boolean;
  onSound: () => void;
  onLeave: () => void;
  status: string;
  statusBad: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="mx-auto w-full max-w-6xl flex-1 px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 py-6">
        <Brand onClick={onLeave} />
        <div className="flex items-center gap-4">
          <p className="font-mono text-sm tracking-[0.2em] text-muted">{code}</p>
          <button type="button" className={ghostBtn} onClick={onLeave}>
            Leave
          </button>
        </div>
      </header>
      <div className="relative overflow-hidden rounded-2xl border border-line bg-black">
        <video
          ref={remoteVideoRef}
          data-testid="remote-video"
          autoPlay
          playsInline
          controls
          className="aspect-video w-full bg-black object-contain"
        />
        {waiting ? (
          <div className="absolute inset-0 grid place-items-center bg-black/70 text-white">Connecting to the host…</div>
        ) : null}
        {soundLocked ? (
          <button type="button" onClick={onSound} className={`${primaryBtn} absolute bottom-6 left-1/2 -translate-x-1/2`}>
            Turn sound on
          </button>
        ) : null}
      </div>
      <Status status={status} bad={statusBad} />
      </div>
      <SiteFooter />
    </div>
  );
}

export function EndedScreen({
  reason,
  onRetry,
  onHome,
}: {
  reason: string;
  onRetry: () => void;
  onHome: () => void;
}) {
  const dropped = reason === "dropped";
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="mx-auto w-full max-w-xl flex-1 px-6">
        <header className="py-6">
          <Brand onClick={onHome} />
        </header>
        <div className="pt-16">
          <h1 className="font-serif text-5xl tracking-tight text-ink">
            {dropped ? "The host's connection dropped." : "The host stopped sharing."}
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            {dropped ? (
              <button type="button" className={primaryBtn} data-testid="retry-button" onClick={onRetry}>
                Try again
              </button>
            ) : null}
            <button type="button" className={ghostBtn} onClick={onHome}>
              Back
            </button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
