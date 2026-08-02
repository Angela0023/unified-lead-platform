import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RecentSearches } from "@/components/recent-searches";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-10 px-6 py-16 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Unified Lead Platform
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          Smart lead generation engine that replaces manual workflows across
          Apollo, DeepSeek, Firecrawl, and Million Verifier. Set filters,
          describe your ideal customer profile, and get validated leads
          delivered automatically.
        </p>
        <Button asChild size="lg">
          <Link href="/search">Find Leads</Link>
        </Button>
      </div>
      <div className="text-left">
        <RecentSearches />
      </div>
    </main>
  );
}
