import type { Metadata } from "next";
import { FaqSection, SiteFooter, SiteHeader } from "../components/screens";

export const metadata: Metadata = {
  title: "FAQ · Screnn",
  description: "How a Screnn share works: codes, viewers, accounts, and what happens when a room is full.",
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <FaqSection page />
      <SiteFooter links />
    </div>
  );
}
