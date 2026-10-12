"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HostScreen, Status } from "../components/screens";
import { DashboardShell } from "../components/DashboardShell";
import { useShareSession } from "../hooks/useShareSession";
import { fetchSession, FREE_SHARE_LIMIT, sharesLeft, signOut } from "../lib/account";

export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-paper" />}>
      <DashboardScreen />
    </Suspense>
  );
}

function DashboardScreen() {
  const router = useRouter();
  const session = useShareSession({ keepPath: true });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancel = false;
    fetchSession()
      .then((saved) => {
        if (cancel) return;
        if (!saved) router.replace("/sign-in");
        else setReady(true);
      })
      .catch(() => {
        if (!cancel) router.replace("/sign-in");
      });
    return () => {
      cancel = true;
    };
  }, [router, session.view]);

  async function leave() {
    if (session.view === "host") session.endShare();
    await signOut();
    router.push("/");
  }

  if (!ready) {
    return <main className="min-h-screen bg-paper" />;
  }

  if (session.view === "host" && session.code) {
    return (
      <>
        {session.banner ? (
          <div className="sticky top-0 z-30 bg-ink px-4 py-2 text-center text-sm font-semibold text-white">{session.banner}</div>
        ) : null}
        <HostScreen
          code={session.code}
          viewerCount={session.viewerCount}
          localVideoRef={session.localVideoRef}
          onStop={session.endShare}
          onSignOut={leave}
          status={session.status}
          statusBad={session.statusBad}
        />
      </>
    );
  }

  return (
    <DashboardShell
      title="Overview"
      action={
        <button
          type="button"
          data-testid="dashboard-share"
          onClick={() => void session.startShare()}
          disabled={session.busy}
          className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white disabled:cursor-wait disabled:opacity-60"
        >
          {session.busy ? "Starting…" : "Share a screen"}
        </button>
      }
    >
      {(account) => {
        const remaining = sharesLeft(account);
        const shareLabel = session.busy ? "Starting…" : remaining === 0 ? "Share limit reached" : "Share a screen";
        return (
          <>
            <section id="overview" className="scroll-mt-6">
              <p className="text-sm text-muted">Signed in as</p>
              <p data-testid="dashboard-name" className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-ink">
                {account.name}
              </p>
              <p className="mt-2 text-sm text-muted">
                {remaining === 0 ? "You have used all 3 free shares." : `${remaining} of ${FREE_SHARE_LIMIT} free shares left.`}
              </p>
              <Status status={session.status} bad={session.statusBad} />
            </section>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Plan" value="Free" detail="Current plan" />
              <Stat label="Room size" value="3" detail="1 hour per share" />
              <Stat label="Live share" value="None" detail="No code is active" />
              <Stat label="Shares" value={String(remaining)} detail={`${FREE_SHARE_LIMIT} on the free plan`} />
            </div>

            <div className="mt-6 grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
              <section id="shares" className="scroll-mt-6 overflow-hidden rounded-2xl bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
                  <h2 className="text-base font-semibold tracking-tight">Recent shares</h2>
                  <button
                    type="button"
                    onClick={() => void session.startShare()}
                    disabled={session.busy}
                    className="text-sm font-medium text-ink hover:underline disabled:opacity-60"
                  >
                    New share
                  </button>
                </div>
                <div className="hidden grid-cols-[1.2fr_0.8fr_0.6fr_0.7fr] gap-3 px-5 py-3 text-xs font-medium text-muted sm:grid">
                  <span>Started</span>
                  <span>Code</span>
                  <span>Viewers</span>
                  <span>Status</span>
                </div>
                <div className="border-t border-black/5 px-5 py-14 text-center">
                  <p className="text-base font-semibold tracking-tight">No shares yet</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                    When you share a screen, the code and viewer count will show up here.
                  </p>
                  <button
                    type="button"
                    onClick={() => void session.startShare()}
                    disabled={session.busy}
                    className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white disabled:cursor-wait disabled:opacity-60"
                  >
                    {shareLabel}
                  </button>
                </div>
              </section>

              <section id="plan" className="scroll-mt-6 rounded-2xl bg-white p-5">
                <p className="text-sm text-muted">Plan</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Free</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  You and 2 viewers, for 1 hour. {remaining} of {FREE_SHARE_LIMIT} shares left.
                </p>
                <ul className="mt-5 space-y-3 text-sm">
                  <PlanRow label="People in the room" value="3" />
                  <PlanRow label="Time" value="1 hour" />
                  <PlanRow label="Shares left" value={`${remaining} of ${FREE_SHARE_LIMIT}`} />
                  <PlanRow label="Price" value="$0" />
                  <PlanRow label="Billing" value="Not connected" />
                </ul>
                <a
                  href="/dashboard/billing"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-ink/10 px-5 py-3 text-sm font-medium text-ink"
                >
                  Billing & invoices
                </a>
              </section>
            </div>
          </>
        );
      }}
    </DashboardShell>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <section className="rounded-2xl bg-white px-5 py-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
    </section>
  );
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-4 border-t border-black/5 pt-3">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </li>
  );
}
