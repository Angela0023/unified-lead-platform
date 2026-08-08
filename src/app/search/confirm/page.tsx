import { Suspense } from "react";
import type { Metadata } from "next";
import { ConfirmSearch } from "@/components/confirm-search";

export const metadata: Metadata = {
  title: "Confirm Search - Unified Lead Platform",
  description:
    "Review pre-flight checks, cost estimate, and approve your search.",
};

export default function ConfirmSearchPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">
        Confirm Your Search
      </h1>
      <Suspense>
        <ConfirmSearch />
      </Suspense>
    </main>
  );
}
