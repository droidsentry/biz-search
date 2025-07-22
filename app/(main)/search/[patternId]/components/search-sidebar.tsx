"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SearchSidebarProps {
  children: ReactNode;
  className?: string;
}

export function SearchSidebar({ children, className }: SearchSidebarProps) {
  return (
    <aside
      className={cn(
        // モバイルでは固定位置、デスクトップではsticky
        "fixed md:sticky right-0 top-0 md:top-10 h-screen md:h-[calc(100vh-2.5rem)]",
        "w-full md:w-[400px] flex-shrink-0",
        "bg-background border rounded-lg m-2",
        "flex flex-col",
        "transform transition-transform duration-300 md:transform-none",
        "md:self-start",
        className
      )}
    >
      <ScrollArea className="flex-1 h-full">
        <div className="p-4 md:p-6 space-y-6">{children}</div>
      </ScrollArea>
    </aside>
  );
}
