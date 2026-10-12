"use client";

import { useState, type FormEvent } from "react";
import { Field } from "../../components/AuthCard";
import { DashboardShell } from "../../components/DashboardShell";
import { updateAccount, type Account } from "../../lib/account";

export default function SettingsPage() {
  return (
    <DashboardShell title="Settings">
      {(account) => <SettingsForm account={account} />}
    </DashboardShell>
  );
}

function SettingsForm({ account }: { account: Account }) {
  const [name, setName] = useState(account.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    const nextName = name.trim();
    if (!nextName) {
      setError("Enter your name.");
      return;
    }
    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }
    if (nextPassword && nextPassword.length < 8) {
      setError("Use at least 8 characters for the new password.");
      return;
    }
    try {
      await updateAccount({
        name: nextName,
        email: account.email,
        currentPassword,
        password: nextPassword || undefined,
      });
      window.dispatchEvent(new Event("screnn-account"));
      setCurrentPassword("");
      setNextPassword("");
      setError("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your account.");
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl rounded-2xl bg-white p-5 sm:p-8">
      <h2 className="text-base font-semibold tracking-tight">Account</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">Changes are saved to your account.</p>
      <div className="mt-6 space-y-4">
        <Field id="settings-name" label="Name" type="text" value={name} onChange={setName} autoComplete="name" testId="settings-name" />
        <Field
          id="settings-email"
          label="Email"
          type="email"
          value={account.email}
          onChange={() => {}}
          autoComplete="email"
          testId="settings-email"
          disabled
          hint={<span className="text-sm text-muted">Email can't be changed</span>}
        />
        <Field
          id="settings-current-password"
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
          testId="settings-current-password"
        />
        <Field
          id="settings-new-password"
          label="New password"
          type="password"
          value={nextPassword}
          onChange={setNextPassword}
          autoComplete="new-password"
          testId="settings-new-password"
          hint={<span className="text-sm text-muted">Leave blank to keep it</span>}
        />
      </div>
      {error ? (
        <p data-testid="settings-error" role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p data-testid="settings-saved" role="status" className="mt-4 text-sm text-ink">
          Saved.
        </p>
      ) : null}
      <button
        type="submit"
        data-testid="settings-save"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white"
      >
        Save changes
      </button>
    </form>
  );
}
