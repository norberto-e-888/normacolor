"use client";

import { es } from "date-fns/locale";
import { ChevronLeftSquare, ChevronRightSquare } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/client";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, ...props }: CalendarProps) {
  props.hideNavigation = false;
  props.showOutsideDays = false;

  return (
    <DayPicker
      className={cn("p-3", className)}
      locale={es}
      classNames={{
        months: "flex sm:flex-row-reverse space-y-0 space-x-0",
        month: "space-y-2",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        caption_dropdowns: "flex gap-1",
        dropdown:
          "cursor-pointer rounded-md bg-transparent p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
        dropdown_month: "flex-1",
        dropdown_year: "flex-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex w-full",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
        row: "flex w-full mt-2",
        cell: "text-center text-sm relative p-0 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 w-9",
        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        nav: "-ml-12",
        ...classNames,
      }}
      components={{
        PreviousMonthButton: ({ ...props }) => (
          <button {...props}>
            <ChevronLeftSquare />
          </button>
        ),
        NextMonthButton: ({ ...props }) => (
          <button {...props}>
            <ChevronRightSquare />
          </button>
        ),
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
