import { Metadata } from "next";
import { getBaseURL } from "@/lib/base-url";
import { Button } from "@/components/ui/button";
import { formatAddressToCityLevel } from "@/lib/utils/address";
import { ArrowLeft, PencilIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOwnerDetailsAction } from "./action";
import { CompanyInfoSidebar } from "./components/company-info-sidebar";
import { MapView } from "./components/map-view";
import { OwnerInfo } from "./components/owner-info";
import { OwnerSearch } from "./components/owner-search";
import { StreetView } from "./components/street-view";
import { InvestigationStatusButtons } from "./components/investigation-status-buttons";
import { getDefaultSearchFormValues } from "@/lib/helpers/server-constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string; ownerId: string }>;
}): Promise<Metadata> {
  const { projectId, ownerId } = await params;
  const { data: owner } = await getOwnerDetailsAction(projectId, ownerId);

  return {
    metadataBase: new URL(getBaseURL()),
    title: owner ? `${owner.name} - BizSearch` : "所有者詳細 - BizSearch",
    description: owner
      ? `${owner.name}の詳細情報、地図、ストリートビュー、関連企業情報を確認できます。`
      : "所有者の詳細情報と関連データを確認できます。",
  };
}

export default async function OwnerDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; ownerId: string }>;
}) {
  const { projectId, ownerId } = await params;

  // 所有者詳細情報を取得
  const { data: owner, error } = await getOwnerDetailsAction(
    projectId,
    ownerId
  );

  if (error || !owner) {
    notFound();
  }

  // 検索フォームのデフォルト値を取得
  const searchFormDefaults = await getDefaultSearchFormValues();

  return (
    <div className="mx-auto max-w-[1400px] px-2 md:px-4">
      {/* ヘッダー */}
      <div className="py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="size-4" />
              物件一覧へ戻る
            </Button>
          </Link>
        </div>

        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-foreground">{owner.name}</h1>
            <div className="mt-2 space-y-1">
              {owner.properties.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  所有物件: {owner.properties[0].address}
                </p>
              )}
            </div>
          </div>
          <InvestigationStatusButtons
            ownerId={owner.id}
            initialStatus={owner.investigation_status || "pending"}
          />
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex gap-6 pb-10 relative">
        {/* 左側：メインコンテンツエリア */}
        <div className="flex-1 space-y-6">
          {/* 所有者住所と地図 */}
          <div className="bg-background border border-muted-foreground/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">所有者住所</h3>

            {/* 住所情報 */}
            <OwnerInfo owner={owner} />

            {/* 地図とストリートビュー */}
            <div className="mt-6 pt-6 border-t border-muted-foreground/20">
              <div
                className={`grid ${
                  owner.street_view_available ? "grid-cols-2" : "grid-cols-1"
                } gap-4`}
              >
                <div className="h-[400px]">
                  <MapView
                    lat={owner.lat}
                    lng={owner.lng}
                    address={owner.address}
                  />
                </div>
                {owner.street_view_available && (
                  <div className="h-[400px]">
                    <StreetView
                      lat={owner.lat}
                      lng={owner.lng}
                      streetViewAvailable={owner.street_view_available}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 調査ツール */}
          <div>
            <div className="bg-background border border-muted-foreground/20 rounded-lg p-6 mt-[-1px] ">
              <OwnerSearch
                initialQuery={owner.name}
                initialAddress={formatAddressToCityLevel(owner.address)}
                projectId={projectId}
                ownerId={ownerId}
                searchFormDefaults={searchFormDefaults}
              />
            </div>
          </div>
        </div>

        {/* 右側：サイドバー */}
        <aside className="w-80 shrink-0 hidden lg:block">
          <div className="sticky top-20">
            <CompanyInfoSidebar
              ownerId={owner.id}
              initialCompanies={owner.companies}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
