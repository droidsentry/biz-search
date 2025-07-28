'use client'

import { cn } from '@/lib/utils'

interface ImportProgressProps {
  className?: string
  progress?: {
    currentBatch: number
    totalBatches: number
    processedFiles: number
    totalFiles: number
  }
}

export function ImportProgress({ className, progress }: ImportProgressProps) {
  // プログレスバーの幅を計算
  const progressPercentage = progress 
    ? Math.round((progress.processedFiles / progress.totalFiles) * 100)
    : 0

  return (
    <div className={cn("flex flex-col items-center gap-8 w-full max-w-md", className)}>
      <div className="flex gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-600" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-600 [animation-delay:0.2s]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-600 [animation-delay:0.4s]" />
      </div>
      
      {progress && progress.totalBatches > 1 ? (
        <div className="w-full space-y-4">
          <div className="text-center space-y-2">
            <p className="text-lg text-zinc-400">
              処理 {progress.currentBatch}/{progress.totalBatches} を実行中...
            </p>
            <p className="text-sm text-zinc-500">
              {progress.processedFiles}/{progress.totalFiles} ファイル処理済み
            </p>
          </div>
          
          {/* プログレスバー */}
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-zinc-400 h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <p className="text-center text-sm text-zinc-500">
            {progressPercentage}% 完了
          </p>
        </div>
      ) : (
        <p className="text-lg text-zinc-400">解析中...</p>
      )}
    </div>
  )
}