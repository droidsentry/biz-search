import { notFound } from 'next/navigation'
import { getProjectAction, getProjectPropertiesAction } from './action'
import { PropertyTable } from './components/property-table'
import { ExportButton } from './components/export-button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  // プロジェクト情報を取得
  const { data: project, error: projectError } = await getProjectAction(projectId)
  
  if (projectError || !project) {
    notFound()
  }

  // 物件一覧を取得
  const { data: properties, error: propertiesError } = await getProjectPropertiesAction(
    projectId
  )

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
      </div>

      {/* 物件一覧 */}
      <div className="pb-10">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            顧客一覧
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {properties ? `全${properties.length}件` : '読み込み中...'}
          </p>
        </div>

        {propertiesError ? (
          <div className="rounded-md bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              {propertiesError}
            </p>
          </div>
        ) : properties ? (
          <PropertyTable properties={properties} projectId={projectId} />
        ) : (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">
              物件データを読み込み中...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}