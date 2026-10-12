"use client";

import { useState, type FormEvent } from "react";
import { AuthCard, Field } from "../components/AuthCard";
import { requestPasswordReset } from "../lib/account";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setError("Enter a valid email.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await requestPasswordReset(nextEmail);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll email you a link to choose a new password."
      error={error}
      onSubmit={submit}
      submitLabel={sent ? "Send again" : "Email me a link"}
      submitTestId="forgot-submit"
      busy={busy}
      footer={
        <a href="/sign-in" className="font-medium text-ink hover:underline">
          Back to sign in
        </a>
      }
    >
      <Field id="email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" testId="forgot-email" />
      {sent ? (
        <p data-testid="forgot-sent" className="text-sm leading-relaxed text-ink">
          If that email has an account, a reset link is on its way.
        </p>
      ) : null}
    </AuthCard>
  );
}
