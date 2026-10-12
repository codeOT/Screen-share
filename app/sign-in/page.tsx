"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard, Field } from "../components/AuthCard";
import { signIn } from "../lib/account";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn({ email: email.trim().toLowerCase(), password });
      router.push("/dashboard");
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "That email and password don't match.");
    }
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Open your dashboard and start a share."
      error={error}
      onSubmit={submit}
      submitLabel="Sign in"
      submitTestId="sign-in-submit"
      busy={busy}
      footer={
        <>
          New to Screnn?{" "}
          <a href="/sign-up" className="font-medium text-ink hover:underline">
            Create an account
          </a>
        </>
      }
    >
      <Field id="email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" testId="sign-in-email" />
      <Field
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        testId="sign-in-password"
        hint={
          <a href="/forgot-password" className="text-sm font-medium text-ink hover:underline">
            Forgot password?
          </a>
        }
      />
    </AuthCard>
  );
}
