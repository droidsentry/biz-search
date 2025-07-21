import { notFound } from 'next/navigation'
import { getOwnerDetailsAction } from './action'
import { OwnerInfo } from './components/owner-info'
import { MapView } from './components/map-view'
import { StreetView } from './components/street-view'
import { ResearchTools } from './components/research-tools'
import { GoogleSearch } from './components/google-search'
import { CompanyInfoSidebar } from './components/company-info-sidebar'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function OwnerDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; ownerId: string }>
}) {
  const { projectId, ownerId } = await params
  
  // 所有者詳細情報を取得
  const { data: owner, error } = await getOwnerDetailsAction(projectId, ownerId)
  
  if (error || !owner) {
    notFound()
  }

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

        <h1 className="text-3xl font-bold text-foreground">
          {owner.name}
        </h1>
        <div className="mt-2 space-y-1">
          {owner.properties.length > 0 && (
            <p className="text-sm text-muted-foreground">
              所有物件: {owner.properties[0].address}
            </p>
          )}
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
              <div className={`grid ${owner.street_view_available ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
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
            <ResearchTools ownerName={owner.name} />
            <div className="bg-background border border-muted-foreground/20 rounded-lg p-6 mt-[-1px] rounded-t-none">
              <GoogleSearch initialQuery={owner.name} />
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
  )
}