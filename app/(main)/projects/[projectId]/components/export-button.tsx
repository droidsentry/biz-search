'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportProjectPropertiesToCSV } from '../action'
import { toast } from 'sonner'


interface ExportButtonProps {
  projectId: string
  projectName: string
}

export function ExportButton({ projectId, projectName }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)


  const handleExport = async () => {
    setIsExporting(true)
    try {
      const { data, error } = await exportProjectPropertiesToCSV(projectId)
      
      if (error) {
        toast.error('エクスポートエラー', {
          description: error,
        })
        return
      }

      if (data) {
        // CSVファイルをダウンロード
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        
        link.setAttribute('href', url)
        link.setAttribute('download', `${projectName}_物件一覧_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('エクスポート完了', {
          description: 'CSVファイルのダウンロードが完了しました',
        })

      }
    } catch (error) {
      console.error('エクスポートエラー:', error)
      toast.error('エクスポートエラー', {
        description: '予期せぬエラーが発生しました',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isExporting ? 'エクスポート中...' : 'エクスポート'}
    </Button>
  )
}