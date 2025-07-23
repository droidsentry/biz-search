"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  BarChart3,
  Trash2,
  Search,
  Calendar,
  Globe,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tables } from "@/lib/types/database";
import { useState } from "react";
import { SearchPatternDeleteModal } from "./search-pattern-delete-modal";
import { useGoogleCustomSearchForm } from "@/components/providers/google-custom-search-form";
import { useFormContext } from "react-hook-form";
import {
  GoogleCustomSearchPattern,
  SearchPattern,
} from "@/lib/types/custom-search";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PatternCardsProps {
  patterns: SearchPattern[];
}

export function PatternCards({ patterns }: PatternCardsProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPatternId, setSelectedPatternId] = useState<string>("");
  const { handleSearch, patternId } = useGoogleCustomSearchForm();

  const currentPatternId = patternId;
  const form = useFormContext<GoogleCustomSearchPattern>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const handleDelete = (e: React.MouseEvent, patternId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPatternId(patternId);
    setDeleteModalOpen(true);
  };

  const handlePatternClick = (e: React.MouseEvent, pattern: SearchPattern) => {
    e.preventDefault();

    // URLを更新（これによりプロバイダーのuseEffectがトリガーされる）
    router.push(`/search/execute?patternId=${pattern.id}`);
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
              "group cursor-pointer transition-all hover:shadow-sm  py-0",
              "hover:border-foreground/20 mb-2",
              currentPatternId === pattern.id &&
                "border-primary bg-primary/5 shadow-sm"
            )}
            onClick={(e) => handlePatternClick(e, pattern)}
          >
            <CardContent className="p-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-sm line-clamp-1">
                    {pattern.searchPatternName}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(e, pattern.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>

                {pattern.searchPatternDescription && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {pattern.searchPatternDescription}
                  </p>
                )}

                {/* 検索パラメータの表示 */}
                <div className="space-y-1.5 mt-2">
                  {/* 検索期間 */}
                  {pattern.googleCustomSearchParams.dateRestrict &&
                    pattern.googleCustomSearchParams.dateRestrict !== "all" && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="secondary" className="text-xs">
                          {pattern.googleCustomSearchParams.dateRestrict ===
                          "m6"
                            ? "過去6ヶ月"
                            : pattern.googleCustomSearchParams.dateRestrict ===
                              "y1"
                            ? "過去1年"
                            : pattern.googleCustomSearchParams.dateRestrict ===
                              "y3"
                            ? "過去3年"
                            : pattern.googleCustomSearchParams.dateRestrict ===
                              "y5"
                            ? "過去5年"
                            : pattern.googleCustomSearchParams.dateRestrict ===
                              "y10"
                            ? "過去10年"
                            : "指定なし"}
                        </Badge>
                      </div>
                    )}

                  {/* 追加キーワード */}
                  {pattern.googleCustomSearchParams.additionalKeywords &&
                    pattern.googleCustomSearchParams.additionalKeywords.length >
                      0 && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-3 w-3 text-muted-foreground mt-0.5" />
                        <div className="flex-1 flex flex-wrap items-center gap-1">
                          {pattern.googleCustomSearchParams.additionalKeywords
                            .slice(0, 3)
                            .map((keyword, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="px-1.5 py-0 text-[10px]"
                              >
                                {keyword.value}
                                {keyword.matchType === "exact" && (
                                  <span className="ml-0.5 text-[9px]">
                                    (完全)
                                  </span>
                                )}
                              </Badge>
                            ))}
                          {pattern.googleCustomSearchParams.additionalKeywords
                            .length > 3 && (
                            <Badge
                              variant="outline"
                              className="px-1.5 py-0 text-[10px]"
                            >
                              +
                              {pattern.googleCustomSearchParams
                                .additionalKeywords.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                  {/* 検索対象サイト */}
                  {pattern.googleCustomSearchParams.searchSites &&
                    pattern.googleCustomSearchParams.searchSites.length > 0 &&
                    pattern.googleCustomSearchParams.siteSearchMode !==
                      "any" && (
                      <div className="flex items-start gap-2">
                        <Globe className="h-3 w-3 text-muted-foreground mt-0.5" />
                        <div className="flex-1 flex flex-wrap items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            {pattern.googleCustomSearchParams.siteSearchMode ===
                            "specific"
                              ? "対象"
                              : "除外"}
                            :
                          </span>
                          {pattern.googleCustomSearchParams.searchSites
                            .slice(0, 2)
                            .map((site, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="px-1.5 py-0 text-[10px]"
                              >
                                <LinkIcon className="h-2.5 w-2.5 mr-0.5" />
                                {site}
                              </Badge>
                            ))}
                          {pattern.googleCustomSearchParams.searchSites.length >
                            2 && (
                            <Badge
                              variant="outline"
                              className="px-1.5 py-0 text-[10px]"
                            >
                              +
                              {pattern.googleCustomSearchParams.searchSites
                                .length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground pt-1.5 mt-1.5 border-t">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    <span>{pattern.usageCount}回</span>
                  </div>
                  {pattern.lastUsedAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(pattern.lastUsedAt), "M/d HH:mm", {
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
