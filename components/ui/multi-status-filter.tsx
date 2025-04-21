"use client";

import { Filter } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrderStatus } from "@/database";

export interface StatusOption {
  label: string;
  value: OrderStatus | "";
}

interface MultiStatusFilterProps {
  statusOptions: StatusOption[];
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
}

export function MultiStatusFilter({
  statusOptions,
  selectedStatuses,
  onStatusChange,
}: MultiStatusFilterProps) {
  const [open, setOpen] = useState(false);

  const toggleStatus = (value: string) => {
    if (value === "") {
      // If "All" is selected, clear all other selections
      onStatusChange([]);
      return;
    }

    const newStatuses = selectedStatuses.includes(value)
      ? selectedStatuses.filter((s) => s !== value)
      : [...selectedStatuses, value];

    onStatusChange(newStatuses);
  };

  // Get display text for the button
  const getDisplayText = () => {
    if (selectedStatuses.length === 0) {
      return "Todos";
    }

    if (selectedStatuses.length === 1) {
      const option = statusOptions.find(
        (opt) => opt.value === selectedStatuses[0]
      );
      return option?.label || "Filtro";
    }

    return `${selectedStatuses.length} seleccionados`;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          {getDisplayText()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Estado</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={selectedStatuses.length === 0}
          onCheckedChange={() => {
            onStatusChange([]);
            setOpen(false);
          }}
        >
          Todos
        </DropdownMenuCheckboxItem>
        {statusOptions
          .filter((option) => option.value !== "")
          .map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selectedStatuses.includes(option.value)}
              onCheckedChange={() => toggleStatus(option.value)}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
