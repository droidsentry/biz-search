"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[]; // タグの値
  onChange: (tags: string[]) => void; // タグの変更時のコールバック
  placeholder?: string; // プレースホルダー
  className?: string; // クラス名
  defaultTags?: string[]; // デフォルトのタグ
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Enter domain and press Enter",
  className,
  defaultTags = [],
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const extractDomain = (input: string): string => {
    try {
      // URLっぽい形式の場合、ドメインを抽出
      if (input.includes("://")) {
        const url = new URL(input);
        return url.hostname;
      }
      // wwwで始まる場合もドメインとして扱う
      if (input.startsWith("www.")) {
        return input;
      }
      // それ以外はそのまま返す
      return input;
    } catch {
      // URL解析に失敗した場合はそのまま返す
      return input;
    }
  };

  const addTag = (input: string) => {
    const trimmed = input.trim();
    if (trimmed) {
      const domain = extractDomain(trimmed);
      if (!value.includes(domain)) {
        onChange([...value, domain]);
      }
      setInputValue("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value; // 入力フィールドの現在の値を取得
    setInputValue(newValue); // 状態を更新（画面に反映）

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
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          " flex flex-wrap gap-2 p-3 min-h-[2.75rem] w-full rounded-md text-sm shadow-sm ",
          "bg-transparent transition-colors",
          "border border-neutral-200 dark:border-neutral-800",
          "focus-within:ring-1 focus-within:ring-neutral-950 dark:focus-within:ring-neutral-300",
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-muted text-foreground rounded-md dark:bg-muted dark:text-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="hover:text-foreground/80 dark:hover:text-muted-foreground/60"
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
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[100px] bg-transparent outline-none placeholder:text-muted-foreground dark:placeholder:text-muted-foreground "
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
      <div className="flex items-center gap-2">
        {value.length > 0 && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground transition-colors"
            onClick={() => onChange([])}
          >
            すべてクリア
          </button>
        )}
        {value.length > 0 && (
          <span className="text-xs text-muted-foreground">•</span>
        )}
        {defaultTags && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground transition-colors"
            onClick={() => onChange([...defaultTags])}
          >
            デフォルトに戻す
          </button>
        )}
      </div>
    </div>
  );
}
