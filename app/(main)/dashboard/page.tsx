import { Metadata } from "next";
import { getBaseURL } from "@/lib/base-url";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { format, subDays } from "date-fns";
import { ja } from "date-fns/locale";
import { Building2, FolderOpen, Search, Users } from "lucide-react";
import Link from "next/link";
import {
  ApiUsageByPatternChart,
  ApiUsageChart,
} from "./components/api-usage-chart";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "ダッシュボード - BizSearch",
  description: "BizSearchの利用状況や最新の活動を確認できるダッシュボードです。プロジェクトの概要、API利用状況、検索履歴などを一覧で表示します。",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 統計データを取得
  const [projectsCount, propertiesCount, ownersCount, searchPatternsCount] =
    await Promise.all([
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("properties").select("id", { count: "exact", head: true }),
      supabase.from("owners").select("id", { count: "exact", head: true }),
      supabase
        .from("search_patterns")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  // 最近のプロジェクトを取得
  const { data: recentProjects } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // 最近の検索パターンを取得
  const { data: recentPatterns } = await supabase
    .from("search_patterns")
    .select("id, name, usage_count, last_used_at")
    .eq("user_id", user.id)
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .limit(5);

  // 最近追加された物件を取得
  const { data: recentProperties } = await supabase
    .from("project_properties")
    .select(
      `
      id,
      added_at,
      property:properties!inner (
        address
      ),
      project:projects!inner (
        name
      )
    `
    )
    .order("added_at", { ascending: false })
    .limit(10);

  // API使用状況を取得（過去7日間）
  const sevenDaysAgo = subDays(new Date(), 7);
  const { data: apiUsageData } = await supabase
    .from("search_api_logs")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  // 日付別にグループ化
  const apiUsageByDate =
    apiUsageData?.reduce((acc, log) => {
      const date = format(new Date(log.created_at), "yyyy-MM-dd");
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

  // 過去7日間のデータを生成（デモデータを含む）
  const apiUsageChartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    // デモデータ：実際のデータがない場合はランダムな値を生成
    const actualCount = apiUsageByDate[dateStr] || 0;
    const demoCount = Math.floor(Math.random() * 20) + 5;
    return {
      date: dateStr,
      count: actualCount > 0 ? actualCount : demoCount,
    };
  });

  // パターン別の使用回数を取得
  const { data: patternUsageData } = await supabase
    .from("search_patterns")
    .select("name, usage_count")
    .eq("user_id", user.id)
    .gt("usage_count", 0)
    .order("usage_count", { ascending: false });

  // パターン別のデータ（デモデータを含む）
  const apiUsageByPatternData =
    patternUsageData && patternUsageData.length > 0
      ? patternUsageData.map((pattern) => ({
          pattern_name: pattern.name,
          count: pattern.usage_count || 0,
        }))
      : [
          { pattern_name: "基本検索パターン", count: 45 },
          { pattern_name: "詳細検索（住所含む）", count: 32 },
          { pattern_name: "会社情報検索", count: 28 },
          { pattern_name: "役職者検索", count: 15 },
          { pattern_name: "地域限定検索", count: 10 },
        ];
  const stats = [
    {
      title: "プロジェクト数",
      value: projectsCount?.count || 0,
      icon: FolderOpen,
      href: "/projects",
      description: "アクティブなプロジェクト",
    },
    {
      title: "物件数",
      value: propertiesCount?.count || 0,
      icon: Building2,
      href: "/projects",
      description: "登録済み物件",
    },
    {
      title: "所有者数",
      value: ownersCount?.count || 0,
      icon: Users,
      href: "/projects",
      description: "登録済み所有者",
    },
    {
      title: "検索パターン",
      value: searchPatternsCount?.count || 0,
      icon: Search,
      href: "/search",
      description: "保存済みパターン",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-2 md:px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          ダッシュボード
        </h1>
        <p className="text-muted-foreground">プロジェクトと検索の概要</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stat.value.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <ApiUsageChart data={apiUsageChartData} />
        <ApiUsageByPatternChart data={apiUsageByPatternData} />
      </div>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>最近のプロジェクト</CardTitle>
            <CardDescription>最近作成されたプロジェクト</CardDescription>
          </CardHeader>
          <CardContent>
            {recentProjects && recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between"
                  >
                    <Link
                      href={`/projects/${project.id}`}
                      className="hover:underline"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {project.name}
                      </p>
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(project.created_at), "M/d HH:mm", {
                        locale: ja,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  プロジェクトがありません
                </p>
                <Link href="/projects">
                  <Button size="sm">最初のプロジェクトを作成</Button>
                </Link>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/projects">すべてのプロジェクトを見る</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>よく使う検索パターン</CardTitle>
            <CardDescription>最近使用した検索パターン</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPatterns && recentPatterns.length > 0 ? (
              <div className="space-y-4">
                {recentPatterns.map((pattern) => (
                  <div
                    key={pattern.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {pattern.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        使用回数: {pattern.usage_count}回
                      </p>
                    </div>
                    {pattern.last_used_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(pattern.last_used_at), "M/d HH:mm", {
                          locale: ja,
                        })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  検索パターンがありません
                </p>
                <Link href="/search">
                  <Button size="sm">検索を開始</Button>
                </Link>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/search">検索パターンを管理</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近追加された物件</CardTitle>
          <CardDescription>プロジェクトに追加された最新の物件</CardDescription>
        </CardHeader>
        <CardContent>
          {recentProperties && recentProperties.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">
                      物件住所
                    </th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">
                      プロジェクト
                    </th>
                    <th className="text-right p-2 text-sm font-medium text-muted-foreground">
                      追加日時
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentProperties.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm">{item.property.address}</td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {item.project.name}
                      </td>
                      <td className="p-2 text-sm text-right">
                        {format(new Date(item.added_at), "M/d HH:mm", {
                          locale: ja,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                まだ物件が追加されていません
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
