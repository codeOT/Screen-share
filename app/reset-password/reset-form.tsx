"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCard, Field } from "../components/AuthCard";
import { resetPassword } from "../lib/account";

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("This reset link is missing or no longer works.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await resetPassword(token, password);
      setSaved(true);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Could not save the password.");
    }
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle={saved ? "Your password is saved. Sign in with it." : "This link works for 1 hour."}
      error={error}
      onSubmit={submit}
      submitLabel="Save password"
      submitTestId="reset-submit"
      busy={busy || saved}
      footer={
        <a href="/sign-in" className="font-medium text-ink hover:underline">
          Back to sign in
        </a>
      }
    >
      <Field
        id="password"
        label="New password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        testId="reset-password"
      />
      <Field
        id="confirm"
        label="Confirm password"
        type="password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
        testId="reset-confirm"
      />
      {saved ? (
        <p data-testid="reset-saved" className="text-sm text-ink">
          Password saved.
        </p>
      ) : null}
    </AuthCard>
  );
}
