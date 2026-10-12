import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../components/screens";
import { ContactForm } from "./form";

export const metadata: Metadata = {
  title: "Contact · Screnn",
  description: "Write to the Screnn team about a share, an account, or a plan.",
};

const topics = [
  { title: "A live share", detail: "Codes, viewers, and a room that will not connect." },
  { title: "Your account", detail: "Sign-in, a password reset, or an email change." },
  { title: "A plan", detail: "Free shares, Plus, Premium, or a billing question." },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-paper">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-14 lg:pt-20">
        <div className="grid min-w-0 grid-cols-1 items-stretch gap-12 overflow-hidden lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Write to us</p>
            <h1 className="mt-4 max-w-full font-serif text-[2.6rem] leading-[1.05] tracking-tight text-ink sm:text-6xl">
              <span className="sm:hidden">
                Contact
                <br />
                Our Team
              </span>
              <span className="hidden sm:inline">Contact Our Team</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              Tell us what happened. We read every note and reply to the email you leave.
            </p>
            <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {topics.map((topic) => (
                <li key={topic.title} className="rounded-3xl border border-black/10 bg-white/70 px-5 py-4">
                  <p className="text-[15px] font-medium text-ink">{topic.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{topic.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          <ContactForm />
        </div>
      </main>
      <SiteFooter links />
    </div>
  );
}
