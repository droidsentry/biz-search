import React from "react";
import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/lib/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, BarChart3 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type SearchPattern = Tables<"search_patterns">;

async function getSearchPatterns(
  sortBy: "usage" | "recent" = "recent"
): Promise<SearchPattern[]> {
  const supabase = await createClient();

  // 認証確認
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  // パターンの取得
  let query = supabase
    .from("search_patterns")
    .select("*")
    .eq("user_id", user.id);

  // ソート条件
  if (sortBy === "usage") {
    query = query.order("usage_count", { ascending: false });
  } else {
    query = query.order("last_used_at", {
      ascending: false,
      nullsFirst: false,
    });
  }

  const { data, error } = await query;

  if (error) {
    console.error("パターン取得エラー:", error);
    return [];
  }

  return data || [];
}

interface SearchPatternListProps {
  sortBy?: "usage" | "recent";
}

export default async function SearchPatternList({
  sortBy = "recent",
}: SearchPatternListProps) {
  const patterns = await getSearchPatterns(sortBy);

  if (patterns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">検索パターンがまだありません</p>
        <Link href="/execute?patternId=new">
          <Button className="mt-4">最初の検索を開始</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {patterns.map((pattern) => (
        <Link key={pattern.id} href={`/search/execute?patternId=${pattern.id}`}>
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">{pattern.name}</CardTitle>
              {pattern.description && (
                <CardDescription>{pattern.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span>{pattern.usage_count}回使用</span>
                </div>
                {pattern.last_used_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(pattern.last_used_at), "M/d HH:mm", {
                        locale: ja,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
