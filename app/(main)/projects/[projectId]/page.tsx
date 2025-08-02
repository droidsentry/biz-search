import { Progress } from "@/components/ui/progress";
import { getBaseURL } from "@/lib/base-url";
import { extractRoomNumber } from "@/lib/utils/property-address";
import { Building2Icon, FileText, Users } from "lucide-react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExportButton } from "./components/export-button";
import { PropertyTable } from "./components/property-table";
import { Card, CardContent } from "@/components/ui/card";
import {
  getProject,
  getProjectProperties,
  getProjectStats,
} from "@/lib/main/project";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  const { projectId } = await params;
  const { data: project } = await getProject(projectId);

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
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const [
    { data: project, error: projectError },
    { data: stats },
    { data: properties, error: propertiesError },
  ] = await Promise.all([
    getProject(projectId),
    getProjectStats(projectId),
    getProjectProperties(projectId),
  ]);

  if (projectError || !project) {
    notFound();
  }
  // すべての物件から地番（号室を除いた住所）を取得して、重複を除去
  const landNumbers = properties
    ? Array.from(
        new Set(
          properties.map(
            (property) =>
              extractRoomNumber(property.propertyAddress || "").landNumber
          )
        )
      )
        .filter(Boolean)
        .map((landNumber) => landNumber.replace(/[-－]+$/, "")) // 末尾のハイフンを削除
        .join("、")
    : "";

  return (
    <div className="mx-auto max-w-[1400px] px-2 md:px-4">
      {/* ヘッダー */}
      <div className="py-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {project.name}
            </h1>
          </div>
          <ExportButton projectId={projectId} projectName={project.name} />
        </div>

        {/* 統計情報 */}
        {stats && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-muted/50 p-4">
              <CardContent className="p-0">
                <h2 className="text-sm text-muted-foreground font-semibold mb-3">
                  プロジェクト概要
                </h2>
                {project.description && (
                  <p className="mb-3 text-muted-foreground  line-clamp-2 text-xs">
                    {project.description}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4 content-center">
                  <div className="flex flex-row gap-4 items-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building2Icon className="size-4" />
                      <span className="font-semibold">物件数</span>
                    </div>
                    <p className="text-2xl font-semibold italic md:ml-4 ml-0">
                      {stats.totalProperties}
                    </p>
                  </div>
                  <div className="flex flex-row gap-4 items-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Users className="size-4" />
                      <span className="font-semibold">所有者数</span>
                    </div>
                    <p className="text-2xl font-semibold italic md:ml-4 ml-0">
                      {stats.totalOwners}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 p-4">
              <CardContent className="p-0 h-full">
                <div className="flex flex-col justify-center h-full">
                  <div className="text-sm text-muted-foreground mb-2">
                    所有者調査進捗
                  </div>
                  <Progress value={stats.ownerProgress} className="h-2 mb-2" />
                  <div className="flex justify-between">
                    <p className="text-sm">
                      <span className="font-semibold">
                        {stats.ownerProgress}%
                      </span>
                      <span className="text-muted-foreground ml-2">
                        ({stats.completedOwners + stats.unknownOwners} /
                        {stats.totalOwners}名 )
                      </span>
                    </p>
                    <div className="flex flex-row text-sm text-muted-foreground gap-4">
                      <p>調査前: {stats.pendingOwners}名</p>
                      <p>調査済: {stats.completedOwners}名</p>
                      <p>不明: {stats.unknownOwners}名</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 物件テーブル */}
      <div className="pb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">
              {landNumbers || "住所情報なし"}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {properties ? `全${properties.length}物件` : "読み込み中..."}
          </p>
        </div>

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
      </div>
    </div>
  );
}
