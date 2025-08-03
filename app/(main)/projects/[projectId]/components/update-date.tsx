"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  formatRelativeTime,
  formatToJapaneseDateTime,
} from "@/lib/date-fn/get-date";

interface UpdateDateProps {
  updatedAt: string | null | undefined;
}

export function UpdateDate({ updatedAt }: UpdateDateProps) {
  if (!updatedAt) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <span className="text-muted-foreground text-sm cursor-default">
          {formatRelativeTime(updatedAt)}
        </span>
      </HoverCardTrigger>
      <HoverCardContent side="right" align="center" className="w-auto">
        <p className="text-xs text-muted-foreground">
          {formatToJapaneseDateTime(updatedAt)}
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}
