import { Metadata } from "next";
import { getBaseURL } from "@/lib/base-url";
import { notFound } from "next/navigation";
import {
  getProjectAction,
  getProjectPropertiesAction,
  getProjectOwnersAction,
  getProjectStatsAction,
} from "./action";
import { PropertyTable } from "./components/property-table";
import { OwnerTable } from "./components/owner-table";
import { ExportButton } from "./components/export-button";
import { ArrowLeft, LayoutGrid, Users, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  const { projectId } = await params;
  const { data: project } = await getProjectAction(projectId);

  return {
    metadataBase: new URL(getBaseURL()),
    title: project
      ? `${project.name} - BizSearch`
      : "プロジェクト詳細 - BizSearch",
    description: project
      ? `${project.name}の物件一覧と詳細情報を確認できます。物件の追加、編集、エクスポートなどの管理機能を提供します。`
      : "プロジェクトの物件一覧と詳細情報を確認できます。",
  };
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { projectId } = await params;
  const { view = "properties" } = await searchParams;

  // プロジェクト情報を取得
  const { data: project, error: projectError } = await getProjectAction(
    projectId
  );
  console.log("project", project);

  if (projectError || !project) {
    notFound();
  }

  // プロジェクトの統計情報を取得
  const { data: stats } = await getProjectStatsAction(projectId);

  // 表示モードに応じてデータを取得
  const isPropertyView = view === "properties";
  const { data: properties, error: propertiesError } = isPropertyView
    ? await getProjectPropertiesAction(projectId)
    : { data: null, error: null };

  const { data: owners, error: ownersError } = !isPropertyView
    ? await getProjectOwnersAction(projectId)
    : { data: null, error: null };

  return (
    <div className="mx-auto max-w-[1400px] px-2 md:px-4">
      {/* ヘッダー */}
      <div className="py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="size-4" />
              プロジェクト一覧へ戻る
            </Button>
          </Link>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {project.description}
              </p>
            )}
          </div>
          <ExportButton projectId={projectId} projectName={project.name} />
        </div>

        {/* 統計情報 */}
        {stats && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <FileText className="size-4" />
                <span>物件数</span>
              </div>
              <p className="text-2xl font-semibold">{stats.totalProperties}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="size-4" />
                <span>所有者数</span>
              </div>
              <p className="text-2xl font-semibold">{stats.totalOwners}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">
                所有者調査進捗
              </div>
              <Progress value={stats.ownerProgress} className="h-2 mb-2" />
              <p className="text-sm">
                <span className="font-semibold">{stats.ownerProgress}%</span>
                <span className="text-muted-foreground ml-2">
                  ({stats.completedOwners}/{stats.totalOwners}名完了)
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* タブによる表示切り替え */}
      <Tabs defaultValue={view} className="pb-10">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="properties" asChild>
              <Link
                href={`/projects/${projectId}?view=properties`}
                className="flex items-center gap-2"
              >
                <LayoutGrid className="size-4" />
                物件ベース表示
              </Link>
            </TabsTrigger>
            <TabsTrigger value="owners" asChild>
              <Link
                href={`/projects/${projectId}?view=owners`}
                className="flex items-center gap-2"
              >
                <Users className="size-4" />
                所有者ベース表示
              </Link>
            </TabsTrigger>
          </TabsList>
          <p className="text-sm text-muted-foreground">
            {isPropertyView && properties ? `全${properties.length}物件` : ""}
            {!isPropertyView && owners
              ? `全${new Set(owners.map((o) => o.owner.id)).size}名の所有者`
              : ""}
            {!properties && !owners ? "読み込み中..." : ""}
          </p>
        </div>

        <TabsContent value="properties" className="mt-0">
          {propertiesError ? (
            <div className="rounded-md bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{propertiesError}</p>
            </div>
          ) : properties ? (
            <PropertyTable properties={properties} projectId={projectId} />
          ) : (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">物件データを読み込み中...</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="owners" className="mt-0">
          {ownersError ? (
            <div className="rounded-md bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{ownersError}</p>
            </div>
          ) : owners ? (
            <OwnerTable owners={owners} projectId={projectId} />
          ) : (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">
                所有者データを読み込み中...
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
