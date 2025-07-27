'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { FileDropzone } from './file-dropzone'
import { FileConfirm } from './file-confirm'
import { ImportProgress } from './import-progress'
import { ResultsTable } from './results-table'
import type { ImportStep, ParseResult } from '../types'

export function PropertyImportForm() {
  const [step, setStep] = useState<ImportStep>('upload')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [results, setResults] = useState<ParseResult[]>([])
  const [processingProgress, setProcessingProgress] = useState({
    currentBatch: 0,
    totalBatches: 0,
    processedFiles: 0,
    totalFiles: 0
  })

  const processFiles = useCallback(async () => {
    setStep('processing')

    try {
      const BATCH_SIZE = 50 // バッチサイズ
      const totalFiles = selectedFiles.length
      const batchCount = Math.ceil(totalFiles / BATCH_SIZE)
      
      let allResults: ParseResult[] = []
      let totalSuccessful = 0
      let totalFailed = 0

      // バッチ処理
      for (let i = 0; i < batchCount; i++) {
        const start = i * BATCH_SIZE
        const end = Math.min(start + BATCH_SIZE, totalFiles)
        const batchFiles = selectedFiles.slice(start, end)
        
        // 進捗情報を設定（進捗表示コンポーネントで使用）
        const currentBatch = i + 1
        const processedFiles = start
        
        // 進捗状態を更新
        setProcessingProgress({
          currentBatch,
          totalBatches: batchCount,
          processedFiles,
          totalFiles
        })
        
        // バッチの進捗を表示
        toast.info(`バッチ ${currentBatch}/${batchCount} を処理中... (${start + 1}-${end}/${totalFiles}ファイル)`)

        // FormDataを作成
        const formData = new FormData()
        batchFiles.forEach(file => {
          formData.append('pdfs', file)
        })

        // APIエンドポイントに送信
        const response = await fetch('/api/parse-documents', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (!response.ok) {
          // エラーが発生してもバッチ処理を継続
          console.error(`バッチ ${currentBatch} エラー:`, data.error)
          toast.error(`バッチ ${currentBatch} の処理に失敗: ${data.error}`)
          
          // 失敗したファイルもresultsに追加（エラー表示のため）
          const failedResults = batchFiles.map(file => ({
            fileName: file.name,
            fileSize: file.size,
            status: 'error' as const,
            error: data.error || 'バッチ処理エラー',
            processingTime: 0,
            propertyData: undefined
          }))
          allResults = [...allResults, ...failedResults]
          totalFailed += batchFiles.length
          continue
        }

        // 通常のJSONレスポンスを処理
        const batchResults: ParseResult[] = data.results.map((result: any) => ({
          fileName: result.fileName,
          fileSize: result.fileSize,
          status: result.status,
          pageCount: result.pageCount,
          textLength: result.textLength,
          processingTime: 0,
          propertyData: result.propertyData,
          error: result.error,
          isSuspiciousFile: result.isSuspiciousFile,
          suspiciousReason: result.suspiciousReason
        }))

        allResults = [...allResults, ...batchResults]
        
        // サマリー情報を累積
        totalSuccessful += data.summary.successful
        totalFailed += data.summary.failed
      }

      // 全バッチ処理完了
      setResults(allResults)
      setStep('complete')
      
      // 最終サマリー
      if (totalFailed === 0) {
        toast.success(`${totalSuccessful}件のPDFを解析しました（${batchCount}バッチで処理）`)
      } else {
        toast.warning(`${totalSuccessful}/${totalFiles}件の解析に成功しました（${batchCount}バッチで処理）`)
      }
    } catch (error) {
      console.error('Processing error:', error)
      toast.error(error instanceof Error ? error.message : 'PDFの処理中にエラーが発生しました')
      setStep('confirm')
    }
  }, [selectedFiles])

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      toast.error('PDFファイルを選択してください')
      return
    }

    setSelectedFiles(acceptedFiles)
    setStep('confirm')
  }, [])

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleCancel = useCallback(() => {
    setSelectedFiles([])
    setStep('upload')
  }, [])

  const handleReset = useCallback(() => {
    setSelectedFiles([])
    setResults([])
    setStep('upload')
  }, [])

  return (
    <div className="mx-auto max-w-[1400px] px-2 md:px-4 py-8">
      {step === 'upload' && (
        <div className="space-y-8 max-w-3xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-white">PDFインポート</h1>
            <p className="mt-2 text-zinc-400">
              不動産名簿PDFをドロップして解析を開始
            </p>
          </div>
          
          <FileDropzone onDrop={handleDrop} />
        </div>
      )}

      {step === 'confirm' && (
        <div className="max-w-3xl mx-auto">
          <FileConfirm 
            files={selectedFiles}
            onConfirm={processFiles}
            onCancel={handleCancel}
            onRemoveFile={handleRemoveFile}
          />
        </div>
      )}

      {step === 'processing' && (
        <div className="flex min-h-[400px] items-center justify-center">
          <ImportProgress progress={processingProgress} />
        </div>
      )}

      {step === 'complete' && (
        <ResultsTable 
          results={results} 
          onReset={handleReset}
          onDelete={(index) => {
            setResults(prev => prev.filter((_, i) => i !== index))
          }}
        />
      )}
    </div>
  )
}