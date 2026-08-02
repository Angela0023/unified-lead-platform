"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchEstimate, SearchInput } from "@/lib/types";

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

interface CostEstimateProps {
  input: SearchInput;
}

export function CostEstimate({ input }: CostEstimateProps) {
  const query = useQuery({
    queryKey: ["estimate", input],
    queryFn: async () => {
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        throw new Error("Failed to generate estimate");
      }
      return (await response.json()) as SearchEstimate;
    },
    retry: false,
  });

  if (query.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cost & Time Estimate (Stage 2)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (query.isError) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-destructive">
          {(query.error as Error).message}
        </CardContent>
      </Card>
    );
  }

  const estimate = query.data!;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Cost & Time Estimate (Stage 2)</CardTitle>
        {estimate.source === "estimated" ? (
          <Badge variant="secondary">Estimated volume</Badge>
        ) : (
          <Badge variant="secondary">Apollo volume</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Estimated Companies</p>
            <p className="text-xl font-semibold">
              ~{estimate.companiesExpected}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Estimated Final Leads</p>
            <p className="text-xl font-semibold">
              {estimate.leadsExpectedMin}-{estimate.leadsExpectedMax}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Estimated Time</p>
            <p className="text-xl font-semibold">
              {estimate.timeMinutes} min
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phase</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estimate.phases.map((phase) => (
              <TableRow key={phase.phase}>
                <TableCell className="font-medium">{phase.phase}</TableCell>
                <TableCell className="text-muted-foreground">
                  {phase.detail}
                </TableCell>
                <TableCell className="text-right">
                  {formatMoney(phase.costMin)} - {formatMoney(phase.costMax)}
                </TableCell>
                <TableCell className="text-right">
                  ~{phase.timeMinutes} min
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-semibold" colSpan={2}>
                Total Estimated Cost
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatMoney(estimate.costMin)} - {formatMoney(estimate.costMax)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                ~{estimate.timeMinutes} min
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="rounded-md border p-3 text-sm">
          <p className="mb-1 font-medium">Estimated Credit Usage</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              Apollo: ~{estimate.credits.apollo.toLocaleString()} credits
            </Badge>
            <Badge variant="outline">
              Firecrawl: ~{estimate.credits.firecrawl.toLocaleString()}
            </Badge>
            <Badge variant="outline">
              DeepSeek: ~{estimate.credits.deepseek.toLocaleString()}
            </Badge>
            <Badge variant="outline">
              Million Verifier: ~{estimate.credits.millionVerifier.toLocaleString()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
