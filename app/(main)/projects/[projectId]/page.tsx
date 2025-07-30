import { Metadata } from "next";
import { getBaseURL } from "@/lib/base-url";
import { notFound } from "next/navigation";
import {
  getProjectAction,
  getProjectPropertiesAction,
  getProjectStatsAction,
} from "./action";
import { PropertyTable } from "./components/property-table";
import { ExportButton } from "./components/export-button";
import { ArrowLeft, FileText, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { extractRoomNumber } from "@/lib/utils/property-address";

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
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

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

  // 物件データを取得
  const { data: properties, error: propertiesError } =
    await getProjectPropertiesAction(projectId);

  // すべての物件から地番（号室を除いた住所）を取得して、重複を除去
  const landNumbers = properties
    ? Array.from(
        new Set(
          properties.map(
            (property) =>
              extractRoomNumber(property.property_address || "").landNumber
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
          <PropertyTable
            properties={properties}
            projectId={projectId}
            projectName={project.name}
          />
        ) : (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">物件データを読み込み中...</p>
          </div>
        )}
      </div>
    </div>
  );
}
