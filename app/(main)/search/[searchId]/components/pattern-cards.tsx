"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, BarChart3, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tables } from "@/lib/types/database";
import { useState } from "react";
import { SearchPatternDeleteModal } from "./search-pattern-delete-modal";
import { useGoogleCustomSearchForm } from "@/components/providers/google-custom-search-form";
import { useFormContext } from "react-hook-form";
import { GoogleCustomSearchPattern } from "@/lib/types/custom-search";

type SearchPattern = Tables<"search_patterns">;

interface PatternCardsProps {
  patterns: SearchPattern[];
  currentPatternId?: string;
}

export function PatternCards({
  patterns,
  currentPatternId,
}: PatternCardsProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPatternId, setSelectedPatternId] = useState<string>("");
  const { handleSearch } = useGoogleCustomSearchForm();
  const form = useFormContext<GoogleCustomSearchPattern>();

  const handleDelete = (e: React.MouseEvent, patternId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPatternId(patternId);
    setDeleteModalOpen(true);
  };

  const handlePatternClick = (e: React.MouseEvent, pattern: SearchPattern) => {
    e.preventDefault();

    // 現在のフォームの値を取得
    const currentFormValues = form.getValues();
    
    // パターンのparamsをパース
    const savedParams = pattern.google_custom_search_params as any;

    // フォームにデータを設定（customerNameとaddressは現在の値を維持）
    const formData: GoogleCustomSearchPattern = {
      id: pattern.id,
      userId: pattern.user_id || undefined,
      searchPatternName: pattern.name,
      searchPatternDescription: pattern.description || undefined,
      googleCustomSearchParams: {
        // 現在のフォームの顧客名と住所を維持
        customerName: currentFormValues.googleCustomSearchParams.customerName,
        address: currentFormValues.googleCustomSearchParams.address,
        // その他の設定はパターンから読み込む
        customerNameExactMatch: savedParams.customerNameExactMatch || "exact",
        addressExactMatch: savedParams.addressExactMatch || "partial",
        dateRestrict: savedParams.dateRestrict || "all",
        isAdvancedSearchEnabled: savedParams.isAdvancedSearchEnabled || false,
        additionalKeywords: savedParams.additionalKeywords || [],
        searchSites: savedParams.searchSites || [],
        siteSearchMode: savedParams.siteSearchMode || "any",
      },
    };

    // フォームの値を更新
    form.reset(formData);

    // 自動的に検索を実行
    setTimeout(() => {
      form.handleSubmit(handleSearch)();
    }, 100);
  };

  if (patterns.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          保存された検索パターンがありません
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 gap-2">
        {patterns.map((pattern) => (
          <Card
            key={pattern.id}
            className={cn(
              "group cursor-pointer transition-all hover:shadow-md",
              "hover:border-foreground/20 mb-2",
              currentPatternId === pattern.id && "border-primary bg-primary/5"
            )}
            onClick={(e) => handlePatternClick(e, pattern)}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm line-clamp-1">
                    {pattern.name}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(e, pattern.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {pattern.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {pattern.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    <span>{pattern.usage_count}回</span>
                  </div>
                  {pattern.last_used_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(pattern.last_used_at), "M/d HH:mm", {
                          locale: ja,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SearchPatternDeleteModal
        isOpen={deleteModalOpen}
        patternId={selectedPatternId}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedPatternId("");
        }}
      />
    </>
  );
}
