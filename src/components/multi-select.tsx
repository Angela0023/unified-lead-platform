"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  emptyLabel?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  emptyLabel = "No options selected",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  function toggle(option: string) {
    onChange(
      value.includes(option)
        ? value.filter((item) => item !== option)
        : [...value, option],
    );
  }

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto min-h-10 w-full justify-between py-2"
          >
            {value.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {value.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2">
          <div className="max-h-64 overflow-y-auto">
            {options.map((option) => {
              const selected = value.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggle(option)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                    selected && "bg-accent/50",
                  )}
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => toggle(option)}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Select ${option}`}
                  />
                  <span className="flex-1">{option}</span>
                  {selected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
          <div className="mt-2 border-t pt-2 text-xs text-muted-foreground">
            {value.length > 0 ? `${value.length} selected` : emptyLabel}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
