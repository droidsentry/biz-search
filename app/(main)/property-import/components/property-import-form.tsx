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

  const processFiles = useCallback(async () => {
    setStep('processing')

    try {
      // FormDataを作成
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('pdfs', file)
      })

      // APIエンドポイントに送信
      const response = await fetch('/api/parse-documents', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        // サジェスチョンがある場合は追加で表示
        if (data.suggestion) {
          toast.error(data.suggestion)
        }
        throw new Error(data.error || 'PDFの解析に失敗しました')
      }

      // 通常のJSONレスポンスを処理
      const parseResults: ParseResult[] = data.results.map((result: any) => ({
        fileName: result.fileName,
        fileSize: result.fileSize,
        status: result.status,
        pageCount: result.pageCount,
        textLength: result.textLength,
        processingTime: 0, // APIレスポンスに含まれないため0を設定
        propertyData: result.propertyData,
        error: result.error
      }))

      setResults(parseResults)
      setStep('complete')
      
      // サマリー情報を使用
      const { successful, failed, total } = data.summary
      if (failed === 0) {
        toast.success(`${successful}件のPDFを解析しました`)
      } else {
        toast.warning(`${successful}/${total}件の解析に成功しました`)
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
          <ImportProgress />
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