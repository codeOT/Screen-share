import { Suspense } from "react";
import ShareApp from "./components/ShareApp";

export default function Page() {
  return (
    <Suspense fallback={<main className="bg-paper px-6 py-8 text-lg font-semibold text-ink">Screnn</main>}>
      <ShareApp />
    </Suspense>
  );
}
