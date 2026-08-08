"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleX, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { PreflightResult } from "@/lib/types";

interface PreflightResultsProps {
  /** Called with the result once checks complete (parent decides what to render next). */
  onComplete?: (result: PreflightResult) => void;
}

const CHECK_ICONS: Record<
  string,
  { icon: React.ReactNode; className: string }
> = {
  ok: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    className: "text-emerald-500",
  },
  fail: {
    icon: <CircleX className="h-4 w-4" />,
    className: "text-destructive",
  },
  unknown: {
    icon: <CircleX className="h-4 w-4" />,
    className: "text-muted-foreground",
  },
};

export function PreflightResults({ onComplete }: PreflightResultsProps) {
  const query = useQuery({
    queryKey: ["preflight"],
    queryFn: async () => {
      const response = await fetch("/api/preflight");
      if (!response.ok) {
        throw new Error("Failed to run pre-flight checks");
      }
      const data = (await response.json()) as PreflightResult;
      onComplete?.(data);
      return data;
    },
    retry: false,
  });

  const result = query.data;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Pre-flight Checks (Stage 1)</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
          />
          Re-run
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}

        {query.isError && (
          <p className="text-sm text-destructive">
            {(query.error as Error).message}
          </p>
        )}

        {result && (
          <>
            {result.demo && (
              <Badge variant="secondary">Demo Mode - simulated checks</Badge>
            )}
            <ul className="space-y-2">
              {result.checks.map((check) => {
                const meta = CHECK_ICONS[check.status] ?? CHECK_ICONS.unknown;
                return (
                  <li
                    key={check.key}
                    className="flex items-start justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={meta.className}>{meta.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{check.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {check.message}
                          {check.detail ? ` - ${check.detail}` : ""}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Separator />
            {result.allPassed ? (
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                All systems go - ready to start search
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                <Loader2 className="h-4 w-4" />
                Some checks failed - search cannot start until resolved
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
