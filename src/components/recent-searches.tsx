"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentSearch {
  id: string;
  createdAt: string;
  status: string;
  progressPercent: number;
  industry: string[];
  location: string[];
  targetRole: string;
  companiesValidated: number;
  emailsValid: number;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Queued", className: "bg-muted text-muted-foreground" },
  RUNNING: { label: "Running", className: "bg-blue-100 text-blue-700" },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700",
  },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-700" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecentSearches() {
  const query = useQuery({
    queryKey: ["recent-searches"],
    queryFn: async () => {
      const response = await fetch("/api/searches");
      if (!response.ok) throw new Error("Failed to load searches");
      const data = (await response.json()) as { searches: RecentSearch[] };
      return data.searches;
    },
  });

  if (query.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (query.isError || !query.data || query.data.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No searches yet - start your first search to see history here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Searches</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.data.map((search) => {
          const badge = STATUS_BADGE[search.status] ?? STATUS_BADGE.PENDING;
          return (
            <Link
              key={search.id}
              href={
                search.status === "COMPLETED"
                  ? `/search/${search.id}/results`
                  : `/search/${search.id}/progress`
              }
              className="flex items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-accent"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {search.targetRole} - {search.industry.join(", ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {search.location.join(", ")} · {formatDate(search.createdAt)}{" "}
                  ·{" "}
                  {search.emailsValid > 0
                    ? `${search.emailsValid} valid emails`
                    : `${search.companiesValidated} validated companies`}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
              >
                {badge.label}
              </span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
