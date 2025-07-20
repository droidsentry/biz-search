'use client'

import { useState } from 'react'
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ParseResult } from '../types'

interface ImportResultsProps {
  results: ParseResult[]
  onComplete?: () => void
}

export function ImportResults({ results, onComplete }: ImportResultsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  
  const successCount = results.filter(r => r.success).length
  const failedCount = results.filter(r => !r.success).length
  const allSuccess = failedCount === 0

  return (
    <div className="flex flex-col items-center gap-8">
      {/* 結果サマリー */}
      <div className="flex flex-col items-center gap-4">
        <div className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          allSuccess ? "bg-green-500/10" : "bg-yellow-500/10"
        )}>
          {allSuccess ? (
            <Check className="h-8 w-8 text-green-500" />
          ) : (
            <span className="text-2xl font-semibold text-yellow-500">
              {successCount}
            </span>
          )}
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-medium text-white">
            {allSuccess 
              ? `${results.length}件のPDFを解析しました` 
              : `${successCount}/${results.length}件の解析に成功しました`}
          </h3>
          {!allSuccess && (
            <p className="mt-1 text-sm text-zinc-400">
              {failedCount}件のエラーがあります
            </p>
          )}
        </div>
      </div>

      {/* 詳細表示（エラーがある場合のみデフォルトで表示） */}
      {(!allSuccess || expandedIndex !== null) && (
        <div className="w-full max-w-2xl space-y-2">
          {results.map((result, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50"
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-zinc-800/50"
              >
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-white">{result.fileName}</span>
                </div>
                
                <ChevronDown className={cn(
                  "h-4 w-4 text-zinc-400 transition-transform",
                  expandedIndex === index && "rotate-180"
                )} />
              </button>
              
              {expandedIndex === index && (
                <div className="border-t border-zinc-800 p-4">
                  {result.success && result.textContent ? (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-400">抽出されたテキスト:</p>
                      <pre className="max-h-60 overflow-y-auto rounded bg-black/50 p-3 text-xs text-zinc-300">
                        {result.textContent.slice(0, 500)}
                        {result.textContent.length > 500 && '...'}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-sm text-red-400">{result.message || 'エラーが発生しました'}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 詳細を見るボタン（全て成功の場合） */}
      {allSuccess && expandedIndex === null && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpandedIndex(0)}
          className="text-zinc-400 hover:text-white"
        >
          詳細を見る
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      )}

      {/* 完了ボタン */}
      {onComplete && (
        <Button 
          onClick={onComplete}
          className="mt-4"
        >
          次へ進む
        </Button>
      )}
    </div>
  )
}