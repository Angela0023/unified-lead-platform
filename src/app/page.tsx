import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecentSearches } from "@/components/recent-searches";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <>
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <main className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-16 px-6 py-16 text-center">
        <div className="space-y-8">
          {/* Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
              <Sparkles className="h-4 w-4" />
              Trusted by Growth Agencies
            </div>
          </div>

          {/* Hero Heading */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold tracking-tight">
              Smart Lead Generation
              <br />
              <span className="text-muted-foreground">
                That Actually Works
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl leading-relaxed text-muted-foreground">
              Replace 40 hours of manual work with 15 minutes. AI-powered
              validation across Apollo, DeepSeek, Firecrawl, and Million
              Verifier ensures only quality leads.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/search">
                Find Leads
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/search">View Demo</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-8 pt-8">
            <div>
              <div className="text-4xl font-bold">160x</div>
              <div className="text-sm text-muted-foreground">Time Saved</div>
            </div>
            <div>
              <div className="text-4xl font-bold">70%</div>
              <div className="text-sm text-muted-foreground">
                Quality Rate
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold">$20</div>
              <div className="text-sm text-muted-foreground">
                Cost per Search
              </div>
            </div>
          </div>
        </div>

        {/* Recent Searches */}
        <div className="mx-auto w-full max-w-5xl">
          <RecentSearches />
        </div>
      </main>
    </>
  );
}
