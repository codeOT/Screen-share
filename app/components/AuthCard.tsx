"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Brand } from "./screens";

const primaryBtn =
  "inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-[15px] font-medium text-white transition hover:bg-ink/90 disabled:cursor-wait disabled:opacity-60";

export function AuthCard({
  title,
  subtitle,
  children,
  error,
  onSubmit,
  submitLabel,
  submitTestId,
  busy,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  submitTestId: string;
  busy: boolean;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper px-6">
      <header className="mx-auto flex w-full max-w-md justify-center pt-7">
        <a href="/">
          <Brand />
        </a>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
        <form onSubmit={onSubmit} className="rounded-3xl bg-white p-8">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
          <div className="mt-8 space-y-4">{children}</div>
          {error ? (
            <p data-testid="auth-error" role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <button type="submit" data-testid={submitTestId} className={`${primaryBtn} mt-6`} disabled={busy}>
            {busy ? "Please wait…" : submitLabel}
          </button>
          <p className="mt-5 text-center text-sm text-muted">{footer}</p>
        </form>
      </main>
    </div>
  );
}

export function Field({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  testId,
  hint,
  disabled = false,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  testId: string;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const secret = type === "password";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="block text-sm text-muted">
          {label}
        </label>
        {hint}
      </div>
      <div className="relative mt-1.5">
        <input
          id={id}
          data-testid={testId}
          type={secret && visible ? "text" : type}
          value={value}
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-2xl border border-line bg-paper py-3 text-ink outline-none disabled:cursor-not-allowed disabled:text-muted ${secret ? "px-4 pr-12" : "px-4"}`}
        />
        {secret ? (
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-ink"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M4 5.5 19 18.5M9.2 9.4A3.2 3.2 0 0 0 12 15.2c.7 0 1.3-.2 1.8-.6M6.1 7.8C4.2 9.2 2.5 12 2.5 12S6 17.5 12 17.5c1.3 0 2.5-.3 3.5-.8M10.2 6.7A10 10 0 0 1 12 6.5c6 0 9.5 5.5 9.5 5.5s-.7 1.1-2 2.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
