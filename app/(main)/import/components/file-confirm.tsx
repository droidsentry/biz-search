'use client'

import { X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileConfirmProps {
  files: File[]
  onConfirm: () => void
  onCancel: () => void
  onRemoveFile: (index: number) => void
}

export function FileConfirm({ files, onConfirm, onCancel, onRemoveFile }: FileConfirmProps) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white">ファイルを確認</h2>
        <p className="mt-2 text-zinc-400">
          {files.length}個のPDFファイルが選択されました
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
        <div className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">選択されたファイル</span>
            <span className="text-sm text-zinc-400">
              合計: {formatFileSize(totalSize)}
            </span>
          </div>
        </div>
        
        <div className="divide-y divide-zinc-800">
          {files.map((file, index) => (
            <div 
              key={index}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-zinc-500" />
                <div>
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-zinc-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              
              <button
                onClick={() => onRemoveFile(index)}
                className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                aria-label={`${file.name}を削除`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Button 
          variant="ghost" 
          onClick={onCancel}
          className="text-zinc-400 hover:text-white"
        >
          キャンセル
        </Button>
        <Button 
          onClick={onConfirm}
          disabled={files.length === 0}
        >
          解析を開始
        </Button>
      </div>
    </div>
  )
}