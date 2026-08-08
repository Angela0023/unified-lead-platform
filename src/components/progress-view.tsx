"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleX, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { QualityStats } from "@/components/quality-stats";
import { PHASES } from "@/lib/constants";
import type { SearchStatusResponse } from "@/lib/types";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString();
}

export function ProgressView({ searchId }: { searchId: string }) {
  const query = useQuery({
    queryKey: ["status", searchId],
    queryFn: async () => {
      const response = await fetch(`/api/searches/${searchId}/status`);
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to load status");
      }
      return (await response.json()) as SearchStatusResponse;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "RUNNING" || status === "PENDING" ? 4000 : 10_000;
    },
  });

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{(query.error as Error).message}</p>
        <Button asChild>
          <Link href="/search">Back to Search</Link>
        </Button>
      </div>
    );
  }

  const data = query.data!;
  const isComplete = data.status === "COMPLETED";
  const isFailed = data.status === "FAILED";

  const currentPhaseIndex = PHASES.findIndex(
    (phase) => phase.label === data.currentPhase,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Search Progress</CardTitle>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <Badge className="bg-emerald-100 text-emerald-700">
                Completed
              </Badge>
            ) : isFailed ? (
              <Badge variant="destructive">Failed</Badge>
            ) : (
              <Badge variant="secondary" className="animate-pulse">
                {data.status === "PENDING" ? "Queued" : "Running"}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {data.currentPhase ?? "Queued..."}
              </span>
              <span className="text-muted-foreground">
                {data.progressPercent}%
              </span>
            </div>
            <Progress value={data.progressPercent} />
          </div>

          {isFailed && data.errorMessage && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {data.errorMessage}
            </p>
          )}

          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Started</p>
              <p>{formatDate(data.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Estimated completion</p>
              <p>{formatDate(data.estimatedCompletion)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Completed</p>
              <p>{formatDate(data.completedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline Stages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PHASES.map((phase, index) => {
            const done = isComplete || index < currentPhaseIndex;
            const active =
              !isComplete && index === currentPhaseIndex && !isFailed;
            const failedHere = isFailed && index === currentPhaseIndex;
            return (
              <div
                key={phase.jobType}
                className="flex items-center gap-3 rounded-md border p-3"
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                ) : failedHere ? (
                  <CircleX className="h-5 w-5 shrink-0 text-destructive" />
                ) : active ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                ) : (
                  <span className="h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{phase.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {phase.description}
                  </p>
                </div>
                {active && (
                  <span className="text-xs font-medium text-primary">
                    In progress
                  </span>
                )}
                {done && !isComplete && (
                  <span className="text-xs text-emerald-600">Done</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-5">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Companies Found</p>
            <p className="text-lg font-semibold">{data.stats.companiesFound}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Validated</p>
            <p className="text-lg font-semibold">
              {data.stats.companiesValidated}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Contacts</p>
            <p className="text-lg font-semibold">{data.stats.contactsFound}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Emails Found</p>
            <p className="text-lg font-semibold">{data.stats.emailsFound}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Emails Valid</p>
            <p className="text-lg font-semibold">{data.stats.emailsValid}</p>
          </div>
        </CardContent>
      </Card>

      {data.qualityDistribution && (
        <QualityStats
          distribution={data.qualityDistribution}
          warnings={data.qualityWarnings || []}
        />
      )}

      {isComplete && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={`/search/${searchId}/results`}>View Results</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={`/api/searches/${searchId}/download`}>Download CSV</a>
          </Button>
        </div>
      )}
      {isFailed && (
        <Button asChild variant="outline">
          <Link href="/search">Start a New Search</Link>
        </Button>
      )}
    </div>
  );
}
