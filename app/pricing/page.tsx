import type { Metadata } from "next";
import { PricingSection, SiteFooter, SiteHeader } from "../components/screens";

export const metadata: Metadata = {
  title: "Pricing · Screnn",
  description: "Free includes 3 shares, 1 hour each, for up to 3 people. Plus for 8, Premium with no set limit.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <PricingSection page />
      <SiteFooter links />
    </div>
  );
}
