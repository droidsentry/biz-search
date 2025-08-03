"use client";

import { ProjectCard } from "@/app/(main)/projects/components/project-card";
import { ProjectTable } from "@/app/(main)/projects/components/project-table";
import { useProject } from "@/components/providers/project";
import { ProjectWithProgress } from "@/lib/types/project";

export function ProjectList({ projects }: { projects: ProjectWithProgress[] }) {
  const { viewMode } = useProject();

  return (
    <div className="my-10">
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <ProjectTable projects={projects} />
      )}

      {projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            まだプロジェクトがありません
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            新規プロジェクトボタンから作成してください
          </p>
        </div>
      )}
    </div>
  );
}
