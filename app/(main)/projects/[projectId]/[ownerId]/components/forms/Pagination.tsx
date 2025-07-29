'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface PaginationProps {
  currentPage: number
  hasMoreResults?: boolean
  totalPages?: number
  totalResults?: number
  resultsPerPage?: number
  projectId: string
  ownerId: string
}

export default function Pagination({ 
  currentPage, 
  hasMoreResults = true,
  totalPages,
  totalResults,
  resultsPerPage = 10,
  projectId,
  ownerId
}: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/projects/${projectId}/${ownerId}?${params.toString()}`, { scroll: false })
  }

  const maxPage = 10 // offsetの最大値が9なので、最大10ページ
  // totalPagesが指定されている場合はそれを使用、そうでなければmaxPageを使用
  const effectiveTotalPages = totalPages || maxPage
  const showPrevious = currentPage > 1
  const showNext = currentPage < effectiveTotalPages && hasMoreResults

  if (!showPrevious && !showNext) {
    return null
  }

  // 結果の開始位置と終了位置を計算
  const startResult = totalResults ? (currentPage - 1) * resultsPerPage + 1 : undefined
  const endResult = totalResults ? Math.min(currentPage * resultsPerPage, totalResults) : undefined

  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!showPrevious}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          前へ
        </Button>

        <div className="flex items-center gap-2">
          {Array.from({ length: Math.min(5, effectiveTotalPages) }, (_, i) => {
            let pageNum: number
            if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= effectiveTotalPages - 2) {
              pageNum = effectiveTotalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }

            if (pageNum < 1 || pageNum > effectiveTotalPages) return null

            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                className="min-w-[40px]"
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!showNext}
          className="flex items-center gap-1"
        >
          次へ
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 結果数の表示 */}
      {totalResults && startResult && endResult && (
        <div className="text-center text-sm text-muted-foreground">
          <p>
            {startResult}件目～{endResult}件目
            （全{totalResults.toLocaleString()}件中）
          </p>
        </div>
      )}
    </div>
  )
}