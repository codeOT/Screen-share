"use client";

import { useState, type FormEvent } from "react";

const field =
  "mt-2 w-full min-w-0 rounded-2xl border border-line bg-raise px-4 py-3 text-ink outline-none transition placeholder:text-muted/70 focus:border-ink focus:bg-white";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    const nextEmail = email.trim().toLowerCase();
    const nextMessage = message.trim();
    if (!nextName) {
      setError("Enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setError("Enter a valid email.");
      return;
    }
    if (!nextMessage) {
      setError("Enter a message.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: nextName, email: nextEmail, message: nextMessage }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not send the message.");
      setSent(true);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Could not send the message.");
    }
  }

  if (sent) {
    return (
      <div
        data-testid="contact-sent"
        className="flex h-full min-w-0 flex-col justify-center rounded-[28px] border border-black/10 bg-white px-8 py-12 shadow-[0_24px_60px_rgba(20,20,20,0.06)]"
      >
        <p className="font-serif text-4xl tracking-tight text-ink">Message sent.</p>
        <p className="mt-3 text-base leading-relaxed text-muted">We'll reply to {email.trim()}.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex h-full min-w-0 flex-col rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(20,20,20,0.06)] sm:p-8"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">Name</span>
          <input
            id="contact-name"
            data-testid="contact-name"
            type="text"
            value={name}
            autoComplete="name"
            placeholder="James Carter"
            onChange={(event) => setName(event.target.value)}
            className={field}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Email</span>
          <input
            id="contact-email"
            data-testid="contact-email"
            type="email"
            value={email}
            autoComplete="email"
            placeholder="james@email.com"
            onChange={(event) => setEmail(event.target.value)}
            className={field}
          />
        </label>
      </div>
      <label className="mt-4 flex min-h-40 flex-1 flex-col">
        <span className="text-sm font-medium text-ink">Message</span>
        <textarea
          id="contact-message"
          data-testid="contact-message"
          value={message}
          placeholder="What should we look at?"
          onChange={(event) => setMessage(event.target.value)}
          className={`${field} min-h-32 flex-1 resize-none font-sans`}
        />
      </label>
      {error ? (
        <p data-testid="contact-error" role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">We reply by email.</p>
        <button
          type="submit"
          data-testid="contact-submit"
          disabled={busy}
          className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-white transition hover:bg-ink/90 disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Please wait…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
