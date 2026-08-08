import type { Metadata } from "next";
import { ResultsView } from "@/components/results-view";

export const metadata: Metadata = {
  title: "Search Results - Unified Lead Platform",
  description: "Validated leads from your search, ready to download.",
};

export default function ResultsPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search ID: {params.id.slice(0, 8)}
          </p>
        </div>
      </div>
      <ResultsView searchId={params.id} />
    </main>
  );
}
