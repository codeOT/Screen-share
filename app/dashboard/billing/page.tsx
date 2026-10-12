"use client";

import { DashboardShell } from "../../components/DashboardShell";
import { FREE_SHARE_LIMIT, sharesLeft } from "../../lib/account";

const grades = [
  { id: "free", name: "Free", price: "$0", summary: "3 shares, up to 3 people, 1 hour each. Viewers join free with your code." },
  { id: "plus", name: "Plus", price: "$6.99", summary: "Up to 8 people, with no time limit." },
  { id: "premium", name: "Premium", price: "$15.99", summary: "No set viewer limit, and no time limit." },
] as const;

type GradeId = (typeof grades)[number]["id"];

export default function BillingPage() {
  return (
    <DashboardShell title="Billing & Invoices">
      {(account) => {
        const used = account.sharesUsed;
        const remaining = sharesLeft(account);
        const currentId: GradeId = "free";
        const currentIndex = grades.findIndex((grade) => grade.id === currentId);
        const current = grades[currentIndex];
        const upgrades = grades.slice(currentIndex + 1);
        return (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            <section className="rounded-2xl bg-white px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted">
                    {current.name} · {current.price}
                  </p>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">{current.summary}</p>
                </div>
                {upgrades.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {upgrades.map((grade, index) => (
                      <a
                        key={grade.id}
                        href="/pricing"
                        className={
                          index === 0
                            ? "inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-white"
                            : "inline-flex items-center justify-center rounded-full border border-ink/10 px-4 py-2 text-sm font-medium text-ink"
                        }
                      >
                        Upgrade to {grade.name}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl bg-white px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">Payment</h2>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                    No card on file. Billing is not connected, so nothing is charged.
                  </p>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl bg-white">
              <div className="px-5 py-5 sm:px-6">
                <h2 className="text-base font-semibold tracking-tight">Included usage</h2>
                <p className="mt-1 text-sm text-muted">
                  {remaining} of {FREE_SHARE_LIMIT} shares left
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-y border-black/5 text-muted">
                    <tr>
                      <th className="px-5 py-3 font-medium sm:px-6">Item</th>
                      <th className="px-5 py-3 font-medium">Included</th>
                      <th className="px-5 py-3 font-medium sm:px-6">Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    <UsageRow item="Shares" included={String(FREE_SHARE_LIMIT)} used={String(used)} />
                    <UsageRow item="People in a room" included="3" used="—" />
                    <UsageRow item="Time per share" included="1 hour" used="—" />
                  </tbody>
                </table>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl bg-white">
              <div className="px-5 py-5 sm:px-6">
                <h2 className="text-base font-semibold tracking-tight">Invoices</h2>
                <p className="mt-1 text-sm text-muted">The free plan is $0, so there is nothing to bill.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-y border-black/5 text-muted">
                    <tr>
                      <th className="px-5 py-3 font-medium sm:px-6">Date</th>
                      <th className="px-5 py-3 font-medium">Description</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium sm:px-6">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-muted sm:px-6">
                        No invoices yet.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );
      }}
    </DashboardShell>
  );
}

function UsageRow({ item, included, used }: { item: string; included: string; used: string }) {
  return (
    <tr className="border-b border-black/5 last:border-0">
      <td className="px-5 py-3.5 text-ink sm:px-6">{item}</td>
      <td className="px-5 py-3.5 text-ink">{included}</td>
      <td className="px-5 py-3.5 text-ink sm:px-6">{used}</td>
    </tr>
  );
}
