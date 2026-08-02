import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Unified Lead Platform
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Smart lead generation engine that replaces manual workflows across
        Apollo, DeepSeek, Firecrawl, and Million Verifier. Set filters, describe
        your ideal customer profile, and get validated leads delivered
        automatically.
      </p>
      <Button asChild size="lg">
        <Link href="/search">Find Leads</Link>
      </Button>
    </main>
  );
}
