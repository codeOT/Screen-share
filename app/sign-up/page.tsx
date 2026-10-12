"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard, Field } from "../components/AuthCard";
import { signUp } from "../lib/account";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    const nextEmail = email.trim().toLowerCase();
    if (!nextName) {
      setError("Enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setError("Enter a valid email.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await signUp({ name: nextName, email: nextEmail, password });
      router.push("/dashboard");
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Could not create the account.");
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Share a screen from your dashboard. Viewers still join with a code."
      error={error}
      onSubmit={submit}
      submitLabel="Create account"
      submitTestId="sign-up-submit"
      busy={busy}
      footer={
        <>
          Already have an account?{" "}
          <a href="/sign-in" className="font-medium text-ink hover:underline">
            Sign in
          </a>
        </>
      }
    >
      <Field id="name" label="Name" type="text" value={name} onChange={setName} autoComplete="name" testId="sign-up-name" />
      <Field id="email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" testId="sign-up-email" />
      <Field
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        testId="sign-up-password"
      />
    </AuthCard>
  );
}
