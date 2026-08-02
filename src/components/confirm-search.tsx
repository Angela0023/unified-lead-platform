"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PreflightResults } from "@/components/preflight-results";
import { CostEstimate } from "@/components/cost-estimate";
import type { PreflightResult, SearchInput } from "@/lib/types";

export function ConfirmSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const input: SearchInput | null = useMemo(() => {
    const industry = (searchParams.get("industry") ?? "")
      .split(",")
      .filter(Boolean);
    const location = (searchParams.get("location") ?? "")
      .split(",")
      .filter(Boolean);
    const companySize = searchParams.get("companySize") ?? "";
    const targetRole = searchParams.get("targetRole") ?? "";
    const icpPrompt = searchParams.get("icpPrompt") ?? "";
    if (
      industry.length === 0 ||
      !companySize ||
      location.length === 0 ||
      !targetRole ||
      icpPrompt.length < 20
    ) {
      return null;
    }
    return { industry, companySize, location, targetRole, icpPrompt };
  }, [searchParams]);

  async function startSearch() {
    if (!input) return;
    setIsStarting(true);
    try {
      const response = await fetch("/api/searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to start search");
      }
      const data = (await response.json()) as { searchId: string };
      toast.success("Search started! Track progress below.");
      router.push(`/search/${data.searchId}/progress`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start search",
      );
      setIsStarting(false);
    }
  }

  if (!input) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">
          Missing search parameters. Please fill in the search form first.
        </p>
        <Button asChild>
          <Link href="/search">Back to Search Form</Link>
        </Button>
      </div>
    );
  }

  const canStart = Boolean(preflight?.allPassed) && !isStarting;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Here&apos;s what we understood from your input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <span className="font-medium">Industries:</span>
            {input.industry.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="font-medium">Company size:</span>
            <Badge variant="secondary">{input.companySize} employees</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="font-medium">Locations:</span>
            {input.location.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </div>
          <p>
            <span className="font-medium">Target role: </span>
            {input.targetRole}
          </p>
          <div>
            <span className="font-medium">ICP prompt: </span>
            <p className="mt-1 rounded-md bg-muted p-3">{input.icpPrompt}</p>
          </div>
        </CardContent>
      </Card>

      <PreflightResults onComplete={setPreflight} />

      <CostEstimate input={input} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          onClick={() => void startSearch()}
          disabled={!canStart}
        >
          {isStarting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting Search...
            </>
          ) : (
            "Start Search"
          )}
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/search">Cancel</Link>
        </Button>
      </div>
      {!canStart && preflight && !preflight.allPassed && (
        <p className="text-sm text-destructive">
          Search is disabled because pre-flight checks failed. Fix the issues
          (e.g., start the worker with <code>npm run worker</code>) and re-run
          the checks.
        </p>
      )}
    </div>
  );
}
