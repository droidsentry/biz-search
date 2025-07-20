import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { ProjectWithProgress } from '@/app/(main)/projects/action'
import { Calendar, FileText } from 'lucide-react'

interface ProjectCardProps {
  project: ProjectWithProgress
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            {project.name}
          </CardTitle>
          {project.description && (
            <CardDescription className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            <span>
              {format(new Date(project.created_at), 'yyyy年MM月dd日', { locale: ja })}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4" />
            <span>{project.totalProperties} 件の物件</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">調査進捗</span>
              <span className="font-medium text-foreground">
                {project.progress}%
              </span>
            </div>
            <Progress value={project.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {project.completedProperties}/{project.totalProperties} 件完了
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}