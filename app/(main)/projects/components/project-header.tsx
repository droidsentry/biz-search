'use client'

import { useProject } from "@/components/providers/project"
import { Button } from "@/components/ui/button"
import { LayoutGridIcon, LayoutList } from "lucide-react"

export default function ProjectHeader() {
  const { viewMode, setViewMode } = useProject()
  
  return (
    <div className="text-gray-1000 border-0 border-b border-solid sm:flex sm:items-center sm:justify-between ">
      <h1 className="my-10 text-3xl font-bold">プロジェクト管理</h1>
      <div className="flex items-center gap-1 rounded-md border p-1">
        <Button
          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('grid')}
          className="px-3"
        >
          <LayoutGridIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'table' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('table')}
          className="px-3"
        >
          <LayoutList className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}