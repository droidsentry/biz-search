import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Building2, Users } from "lucide-react";
import { ProjectWithProgress } from "@/lib/types/project";
import { UpdateDate } from "@/components/shared/update-date";
import { UpdateUser } from "@/components/shared/update-user";

export function ProjectCard({ project }: { project: ProjectWithProgress }) {
  const investigatedCount =
    (project.completedOwners ?? 0) + (project.unknownOwners ?? 0);

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="bg-muted/50 hover:bg-accent transition-colors cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            {project.name}
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-muted-foreground line-clamp-1 min-h-5">
            {project.description || " "}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 統計情報 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Building2 className="size-3.5" />
                <span>物件数</span>
              </div>
              <p className="text-2xl font-semibold italic">
                {project.totalProperties}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Users className="size-3.5" />
                <span>所有者数</span>
              </div>
              <p className="text-2xl font-semibold italic">
                {project.totalOwners}
              </p>
            </div>
          </div>

          {/* 進捗バー */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">調査進捗</span>
              <span className="text-xs font-medium">
                {investigatedCount}/{project.totalOwners} ({project.progress}%)
              </span>
            </div>
            <Progress value={project.progress} className="h-1.5" />
          </div>
        </CardContent>
        {(project.lastUpdatedAt || project.lastUpdatedByUsername) && (
          <CardFooter className="pt-3 border-t flex items-center justify-between">
            <UpdateDate updatedAt={project.lastUpdatedAt} />
            <UpdateUser username={project.lastUpdatedByUsername} />
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
