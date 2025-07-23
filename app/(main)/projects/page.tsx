import { Metadata } from "next";
import { getBaseURL } from "@/lib/base-url";
import { getProjectsWithProgress } from "@/app/(main)/projects/action";
import { ProjectList } from "./project-list";

import { ProjectProvider } from "@/components/providers/project";
import ProjectHeader from "./components/project-header";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "プロジェクト一覧 - BizSearch",
  description: "BizSearchで管理しているプロジェクトの一覧です。各プロジェクトの進捗状況や物件数を確認し、新規プロジェクトの作成も行えます。",
};

export default async function ProjectsPage() {
  const projectsWithProgress = await getProjectsWithProgress();

  // console.log("projects", projectsWithProgress);

  return (
    <ProjectProvider>
      <div className="mx-auto max-w-[1400px] px-2 md:px-4">
        <ProjectHeader />
        <ProjectList projects={projectsWithProgress || []} />
      </div>
    </ProjectProvider>
  );
}
