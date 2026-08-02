import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "New Search - Unified Lead Platform",
  description:
    "Define your filters and ideal customer profile to find validated leads.",
};

export default function SearchPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Search</h1>
          <p className="mt-1 text-muted-foreground">
            Set your filters and describe your ideal customer profile.
          </p>
        </div>
        <Button asChild variant="ghost">
          <Link href="/">← Home</Link>
        </Button>
      </div>
      <SearchForm />
    </main>
  );
}
