import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecentSearches } from "@/components/recent-searches";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <section className="flex min-h-screen items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-10 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-400">
              <Star className="h-4 w-4 fill-indigo-400" />
              Top-rated Agency 2024
            </div>
          </div>

          {/* Hero Text */}
          <h1 className="mb-6 text-7xl font-bold leading-[1.1] tracking-tight text-white">
            Smart Lead Generation
            <br />
            <span className="text-gray-400">That Actually Works</span>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-gray-400">
            Replace 40 hours of manual work with 15 minutes. AI-powered
            validation across Apollo, DeepSeek, Firecrawl, and Million Verifier
            ensures only quality leads.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-14 gap-2 rounded-xl bg-indigo-600 px-8 text-base font-semibold text-white hover:bg-indigo-700"
            >
              <Link href="/search">
                Find Leads
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 rounded-xl border-gray-700 bg-transparent px-8 text-base font-semibold text-white hover:bg-gray-900"
            >
              <Link href="/search">View Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-gray-800 bg-[#0a0a0a] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-5xl font-bold text-white">160x</div>
              <div className="text-sm uppercase tracking-wider text-gray-500">
                Time Saved
              </div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-5xl font-bold text-white">70%</div>
              <div className="text-sm uppercase tracking-wider text-gray-500">
                Quality Rate
              </div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-5xl font-bold text-white">$20</div>
              <div className="text-sm uppercase tracking-wider text-gray-500">
                Cost per Search
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Searches */}
      <section className="bg-[#0a0a0a] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <RecentSearches />
        </div>
      </section>
    </div>
  );
}
