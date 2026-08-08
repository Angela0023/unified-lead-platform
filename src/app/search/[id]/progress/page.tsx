import type { Metadata } from "next";
import { ProgressView } from "@/components/progress-view";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Search Progress - Unified Lead Platform",
  description: "Real-time progress of your lead search.",
};

export default function ProgressPage({ params }: { params: { id: string } }) {
  return (
    <>
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">
          Search in Progress
        </h1>
        <p className="-mt-4 mb-6 text-sm text-muted-foreground">
          Search ID: {params.id.slice(0, 8)} - this page updates automatically.
        </p>
        <ProgressView searchId={params.id} />
      </main>
    </>
  );
}
