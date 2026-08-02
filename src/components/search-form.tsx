"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MultiSelect } from "@/components/multi-select";
import {
  INDUSTRY_OPTIONS,
  LOCATION_OPTIONS,
  COMPANY_SIZE_OPTIONS,
} from "@/lib/constants";
import type { SearchInput } from "@/lib/types";

const EXAMPLE_PROMPTS = [
  {
    label: "B2B SaaS (enterprise)",
    prompt:
      "B2B SaaS companies selling to enterprises, must have 50-200 employees, must offer API-first products or developer tools, preferably in fintech or healthcare verticals, must have raised Series A or later funding",
  },
  {
    label: "Fintech",
    prompt:
      "Fintech companies in payments or lending, 20-100 employees, selling B2B to financial institutions, must have SOC 2 compliance, preferably US-based",
  },
  {
    label: "Healthcare tech",
    prompt:
      "Healthcare technology companies, must sell to hospitals or clinics, 50-500 employees, must have HIPAA compliance, must offer cloud-based products",
  },
  {
    label: "Professional services",
    prompt:
      "B2B professional services firms (consulting, agencies) serving enterprise clients, 100-1000 employees, must have at least 10 named enterprise customers, must operate in US or UK",
  },
];

const MIN_ICP_LENGTH = 20;
const VAGUE_KEYWORDS = ["any company", "anyone", "everyone", "all companies", "anything"];

function buildQueryString(input: SearchInput): string {
  const params = new URLSearchParams({
    industry: input.industry.join(","),
    companySize: input.companySize,
    location: input.location.join(","),
    targetRole: input.targetRole,
    icpPrompt: input.icpPrompt,
  });
  return params.toString();
}

export function SearchForm() {
  const router = useRouter();
  const [industry, setIndustry] = useState<string[]>([]);
  const [companySize, setCompanySize] = useState("");
  const [location, setLocation] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState("");
  const [icpPrompt, setIcpPrompt] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isVague, setIsVague] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    if (industry.length === 0) {
      nextErrors.industry = "Please select at least one industry";
    }
    if (!companySize) {
      nextErrors.companySize = "Please select a company size";
    }
    if (location.length === 0) {
      nextErrors.location = "Please select at least one location";
    }
    if (!targetRole.trim()) {
      nextErrors.targetRole = "Please enter a target role";
    }
    if (icpPrompt.trim().length < MIN_ICP_LENGTH) {
      nextErrors.icpPrompt = `ICP prompt must be at least ${MIN_ICP_LENGTH} characters`;
    }

    const lowerPrompt = icpPrompt.toLowerCase();
    setIsVague(
      lowerPrompt.length >= MIN_ICP_LENGTH &&
        VAGUE_KEYWORDS.some((keyword) => lowerPrompt.includes(keyword)),
    );

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setIsSubmitting(true);
    router.push(`/search/confirm?${buildQueryString({ industry, companySize, location, targetRole, icpPrompt })}`);
  }

  function applyExample(prompt: string) {
    setIcpPrompt(prompt);
    setErrors((prev) => ({ ...prev, icpPrompt: "" }));
  }

  return (
    <TooltipProvider delayDuration={200}>
      <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="industry">
            Industry <span className="text-destructive">*</span>
          </Label>
          <MultiSelect
            options={INDUSTRY_OPTIONS}
            value={industry}
            onChange={(value) => {
              setIndustry(value);
              setErrors((prev) => ({ ...prev, industry: "" }));
            }}
            placeholder="Select industries..."
          />
          {errors.industry && (
            <p className="text-sm text-destructive">{errors.industry}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-size">
            Company Size <span className="text-destructive">*</span>
          </Label>
          <Select
            value={companySize}
            onValueChange={(value) => {
              setCompanySize(value);
              setErrors((prev) => ({ ...prev, companySize: "" }));
            }}
          >
            <SelectTrigger id="company-size">
              <SelectValue placeholder="Select company size..." />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option.label} value={option.label}>
                  {option.label} employees
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.companySize && (
            <p className="text-sm text-destructive">{errors.companySize}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">
            Location <span className="text-destructive">*</span>
          </Label>
          <MultiSelect
            options={LOCATION_OPTIONS}
            value={location}
            onChange={(value) => {
              setLocation(value);
              setErrors((prev) => ({ ...prev, location: "" }));
            }}
            placeholder="Select locations..."
          />
          {errors.location && (
            <p className="text-sm text-destructive">{errors.location}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="target-role">
            Target Role <span className="text-destructive">*</span>
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Input
                  id="target-role"
                  placeholder="e.g., CTO, VP Engineering, Head of Product"
                  value={targetRole}
                  onChange={(event) => {
                    setTargetRole(event.target.value);
                    setErrors((prev) => ({ ...prev, targetRole: "" }));
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              The job title of the decision maker you want to contact (e.g.,
              CTO)
            </TooltipContent>
          </Tooltip>
          {errors.targetRole && (
            <p className="text-sm text-destructive">{errors.targetRole}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="icp-prompt">
          ICP Prompt (describe your ideal customer){" "}
          <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="icp-prompt"
          placeholder="Describe your ideal customer profile in plain English. Example: B2B SaaS companies selling to enterprises, 50-200 employees, API-first products..."
          value={icpPrompt}
          onChange={(event) => {
            setIcpPrompt(event.target.value);
            setErrors((prev) => ({ ...prev, icpPrompt: "" }));
          }}
          rows={6}
        />
        {errors.icpPrompt && (
          <p className="text-sm text-destructive">{errors.icpPrompt}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Minimum {MIN_ICP_LENGTH} characters. Include specific criteria like
          &quot;must have&quot;, &quot;preferably&quot;, or &quot;not&quot; for
          better results.
        </p>
        {isVague && (
          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertTitle>Broad ICP detected</AlertTitle>
            <AlertDescription>
              Your ICP is very broad. Consider adding more specific criteria for
              better results (e.g., employee count, funding stage, product
              type).
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Example ICP prompts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {EXAMPLE_PROMPTS.map((example) => (
            <Button
              key={example.label}
              type="button"
              variant="outline"
              className="h-auto w-full justify-start whitespace-normal py-2 text-left"
              onClick={() => applyExample(example.prompt)}
            >
              <span className="font-medium">{example.label}</span>
              <span className="ml-2 line-clamp-2 text-xs text-muted-foreground">
                {example.prompt}
              </span>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
        {isSubmitting ? "Continuing..." : "Continue to Confirmation"}
      </Button>
      </form>
    </TooltipProvider>
  );
}
