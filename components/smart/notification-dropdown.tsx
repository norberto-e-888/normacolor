"use client";

import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { NotificationBell } from "./notification-bell";
import { NotificationList } from "./notification-list";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div>
          <NotificationBell onClick={() => setIsOpen(true)} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <NotificationList onClose={() => setIsOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
