'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { FileDropzone } from './file-dropzone'
import { FileConfirm } from './file-confirm'
import { ImportProgress } from './import-progress'
import { ResultsTable } from './results-table'
import type { ImportStep, ParseResult, ProcessingEvent } from '../types'

export function PropertyImportForm() {
  const [step, setStep] = useState<ImportStep>('upload')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [results, setResults] = useState<ParseResult[]>([])

  const processFiles = useCallback(async () => {
    setStep('processing')
    const parseResults: ParseResult[] = []

    try {
      // FormDataを作成
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('pdfs', file)
      })

      // APIエンドポイントに送信
      const response = await fetch('/api/pdf', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'PDFの解析に失敗しました')
      }

      // NDJSONストリーミングレスポンスを処理
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('レスポンスの読み取りに失敗しました')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const event: ProcessingEvent = JSON.parse(line)
            
            if (event.type === 'result') {
              const data = event.data
              parseResults.push({
                fileName: data.fileName,
                fileSize: data.fileSize,
                status: data.status,
                pageCount: data.pageCount,
                textLength: data.textLength,
                processingTime: data.processingTime,
                propertyData: data.propertyData,
                error: data.error
              })
            } else if (event.type === 'error') {
              toast.error(event.data.message || 'エラーが発生しました')
            }
          } catch (e) {
            console.error('Parse error:', e)
          }
        }
      }

      setResults(parseResults)
      setStep('complete')
      
      const successCount = parseResults.filter(r => r.status === 'success').length
      if (successCount === parseResults.length) {
        toast.success(`${successCount}件のPDFを解析しました`)
      } else {
        toast.warning(`${successCount}/${parseResults.length}件の解析に成功しました`)
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