'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { ProjectWithProgress } from '@/app/(main)/projects/action'

interface ProjectTableProps {
  projects: ProjectWithProgress[]
}

export function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <div className="rounded-lg border border-muted-foreground/20 bg-muted-foreground/5 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted-foreground/5 hover:bg-muted-foreground/10">
            <TableHead className="w-[30%] ">プロジェクト名</TableHead>
            <TableHead className="w-[30%]">メモ</TableHead>
            <TableHead className="w-[15%]">作成日時</TableHead>
            <TableHead className="w-[10%] text-center">物件数</TableHead>
            <TableHead className="w-[15%]">調査進捗</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                プロジェクトがありません
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow key={project.id} className="hover:bg-accent">
                <TableCell className="font-medium">
                  <Link 
                    href={`/projects/${project.id}`}
                    className="text-foreground hover:underline"
                  >
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-sm line-clamp-1">
                    {project.description || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-sm">
                    {format(new Date(project.created_at), 'yyyy/MM/dd', { locale: ja })}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-muted-foreground">
                    {project.totalProperties}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Progress value={project.progress} className="h-2 flex-1" />
                    <span className="text-sm font-medium text-foreground min-w-[3rem] text-right">
                      {project.progress}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}