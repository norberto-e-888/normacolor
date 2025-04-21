"use client";

import { Filter } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [localStatuses, setLocalStatuses] =
    useState<string[]>(selectedStatuses);

  // Sync local state with props when they change
  useEffect(() => {
    setLocalStatuses(selectedStatuses);
  }, [selectedStatuses]);

  const toggleStatus = (value: string) => {
    let newStatuses: string[];

    if (value === "") {
      // "Todos" option - clear selection
      newStatuses = [];
    } else {
      // Toggle the selected status
      newStatuses = localStatuses.includes(value)
        ? localStatuses.filter((s) => s !== value)
        : [...localStatuses, value];
    }

    // Update local state immediately
    setLocalStatuses(newStatuses);

    // Notify parent component with a slight delay to prevent immediate URL change
    // This allows the dropdown to stay open while the state updates
    setTimeout(() => {
      onStatusChange(newStatuses);
    }, 0);
  };

  // Get display text for the button
  const getDisplayText = () => {
    if (localStatuses.length === 0) {
      return "Todos";
    }

    if (localStatuses.length === 1) {
      const option = statusOptions.find(
        (opt) => opt.value === localStatuses[0]
      );
      return option?.label || "Filtro";
    }

    return `${localStatuses.length} seleccionados`;
  };

  // Custom handler to prevent closing
  const handleCheckedChange = (value: string) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleStatus(value);
      return false; // Prevent default behavior
    };
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          {getDisplayText()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel>Estado</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={localStatuses.length === 0}
          onSelect={(e) => e.preventDefault()}
          onClick={handleCheckedChange("")}
          onPointerDown={(e) => e.preventDefault()}
        >
          Todos
        </DropdownMenuCheckboxItem>
        {statusOptions
          .filter((option) => option.value !== "")
          .map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={localStatuses.includes(option.value)}
              onSelect={(e) => e.preventDefault()}
              onClick={handleCheckedChange(option.value)}
              onPointerDown={(e) => e.preventDefault()}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
