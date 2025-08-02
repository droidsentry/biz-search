"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { ProjectWithProgress } from "@/lib/types/project";
import { Badge } from "@/components/ui/badge";
import { UpdateUser } from "@/components/shared/update-user";
import { UpdateDate } from "@/components/shared/update-date";
import { useRouter } from "next/navigation";

export function ProjectTable({
  projects,
}: {
  projects: ProjectWithProgress[];
}) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-muted-foreground/20 bg-muted-foreground/5 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted-foreground/5 hover:bg-muted-foreground/10">
            <TableHead className="w-[25%] ">プロジェクト名</TableHead>
            <TableHead className="w-[20%]">概要</TableHead>
            <TableHead className="w-[10%] text-center">物件数</TableHead>
            <TableHead className="w-[10%] text-center">所有者数</TableHead>
            <TableHead className="w-[15%]">調査状況</TableHead>
            <TableHead className="w-[10%]">進捗</TableHead>
            <TableHead className="w-[10%]">最終更新</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-8"
              >
                プロジェクトがありません
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow
                key={project.id}
                className="font-medium cursor-pointer"
                onClick={() => {
                  router.push(`/projects/${project.id}`);
                }}
              >
                <TableCell className="font-medium cursor-pointer">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-foreground hover:underline"
                  >
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[250px]">
                  <span className="text-muted-foreground text-sm line-clamp-2">
                    {project.description || "-"}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-muted-foreground">
                    {project.totalProperties}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-muted-foreground">
                    {project.totalOwners}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="text-xs">
                      前:{project.pendingOwners ?? 0}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      済:{project.completedOwners ?? 0}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      不明:{project.unknownOwners ?? 0}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="h-2 flex-1" />
                    <span className="text-sm font-medium text-foreground min-w-[2.5rem] text-right">
                      {project.progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <UpdateDate updatedAt={project.lastUpdatedAt} />
                    <UpdateUser username={project.lastUpdatedByUsername} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
