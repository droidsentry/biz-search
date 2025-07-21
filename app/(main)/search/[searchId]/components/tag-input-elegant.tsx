"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Keywords } from "@/lib/types/search";

interface TagInputElegantProps {
  keywords: Keywords[];
  onChange: (tags: Keywords[]) => void;
  placeholder?: string;
  className?: string;
  defaultKeywords?: Keywords[];
}

export function TagInputElegant({
  keywords = [],
  onChange,
  placeholder = "キーワードを入力してEnter",
  className,
  defaultKeywords = [],
}: TagInputElegantProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addTag = (input: string) => {
    const trimmedValue = input.trim();
    if (trimmedValue && !keywords.some((tag) => tag.value === trimmedValue)) {
      // 新規タグはデフォルトで完全一致
      onChange([...keywords, { value: trimmedValue, matchType: "exact" }]);
      setInputValue("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // セパレーターによる自動タグ化
    const separators = [",", "、", ";"];
    const lastChar = newValue[newValue.length - 1];

    if (separators.includes(lastChar)) {
      const tagValue = newValue.slice(0, -1).trim();
      if (tagValue) {
        addTag(tagValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
      onChange(keywords.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(keywords.filter((_, index) => index !== indexToRemove));
  };

  const toggleMatchType = (index: number) => {
    const newTags = [...keywords];
    newTags[index] = {
      ...newTags[index],
      matchType: newTags[index].matchType === "partial" ? "exact" : "partial",
    };
    onChange(newTags);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex flex-wrap gap-2 p-3 min-h-[2.75rem] w-full rounded-md border border-neutral-200 bg-transparent text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-neutral-950 dark:border-neutral-800 dark:focus-within:ring-neutral-300",
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {keywords.map((tag, index) => (
          <span
            key={index}
            className={cn(
              "inline-flex items-center gap-0 text-xs font-medium rounded-md transition-all duration-200 group overflow-hidden",
              tag.matchType === "exact"
                ? "bg-foreground text-background dark:bg-foreground dark:text-background"
                : "bg-muted text-foreground dark:bg-muted dark:text-foreground"
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMatchType(index);
                  }}
                  className={cn(
                    "px-2.5 py-1.5 transition-colors cursor-pointer relative",
                    tag.matchType === "exact"
                      ? "hover:bg-foreground/90 dark:hover:bg-foreground/90"
                      : "hover:bg-muted/80 dark:hover:bg-muted/80"
                  )}
                >
                  {tag.matchType === "exact" && (
                    <span className="opacity-70 mr-0.5">&ldquo;</span>
                  )}
                  {tag.value}
                  {tag.matchType === "exact" && (
                    <span className="opacity-70 ml-0.5">&rdquo;</span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {tag.matchType === "exact"
                    ? "クリックして部分一致に切り替え"
                    : "クリックして完全一致に切り替え"}
                </p>
              </TooltipContent>
            </Tooltip>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className={cn(
                "px-1.5 py-1.5 transition-colors",
                tag.matchType === "exact"
                  ? "hover:text-muted-foreground/60 dark:hover:text-muted-foreground/40"
                  : "hover:text-foreground/80 dark:hover:text-muted-foreground/60"
              )}
              title="削除"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-2 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={keywords.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[100px] bg-transparent outline-none placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
          />
          {inputValue.trim() && (
            <button
              type="button"
              onClick={() => addTag(inputValue)}
              className="p-1.5 hover:bg-muted dark:hover:bg-muted rounded-md transition-colors touch-manipulation"
              aria-label="タグを追加"
            >
              <Plus className="size-4 text-muted-foreground dark:text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {keywords.length > 0 && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground transition-colors"
            onClick={() => onChange([])}
          >
            すべてクリア
          </button>
        )}
        {keywords.length > 0 && (
          <span className="text-xs text-muted-foreground">•</span>
        )}
        {defaultKeywords.length > 0 && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground transition-colors"
            onClick={() =>
              onChange(
                defaultKeywords.map((tag) => ({
                  value: tag.value,
                  matchType: "exact",
                }))
              )
            }
          >
            デフォルトに戻す
          </button>
        )}
      </div>
    </TooltipProvider>
  );
}
