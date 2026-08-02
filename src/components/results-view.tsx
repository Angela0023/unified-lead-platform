"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SearchResultsResponse } from "@/lib/types";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  VALID: { label: "Valid", className: "bg-emerald-100 text-emerald-700" },
  RISKY: { label: "Risky", className: "bg-amber-100 text-amber-700" },
};

export function ResultsView({ searchId }: { searchId: string }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const query = useQuery({
    queryKey: ["results", searchId],
    queryFn: async () => {
      const response = await fetch(`/api/searches/${searchId}/results`);
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to load results");
      }
      return (await response.json()) as SearchResultsResponse;
    },
    refetchInterval: 10_000,
  });

  const filteredLeads = useMemo(() => {
    const leads = query.data?.leads ?? [];
    return leads.filter((lead) => {
      const matchesSearch =
        search === "" ||
        lead.company.toLowerCase().includes(search.toLowerCase()) ||
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        (lead.email ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || lead.emailStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [query.data, search, statusFilter]);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
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
  const summary = data.summary;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary.totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Valid Emails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">
              {summary.validEmails}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Risky Emails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-600">
              {summary.riskyEmails}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {Math.round(summary.successRate * 100)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Leads</CardTitle>
          <Button asChild size="sm">
            <a href={`/api/searches/${searchId}/download`}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </a>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Search company, contact, or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Email status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="VALID">Valid</SelectItem>
                <SelectItem value="RISKY">Risky</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No leads match your filters.
                  </TableCell>
                </TableRow>
              )}
              {filteredLeads.map((lead, index) => {
                const badge =
                  STATUS_BADGE[lead.emailStatus ?? ""] ?? STATUS_BADGE.VALID;
                return (
                  <TableRow key={`${lead.company}-${lead.email}-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{lead.company}</span>
                        {lead.website && (
                          <a
                            href={`https://${lead.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {lead.industry && (
                        <p className="text-xs text-muted-foreground">
                          {lead.industry}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {lead.companyScore ?? "-"}/5
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{lead.name}</span>
                      {lead.linkedinUrl && (
                        <a
                          href={`https://${lead.linkedinUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.title}
                    </TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
