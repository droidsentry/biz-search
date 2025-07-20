import { getProjectsAction } from '@/app/(main)/projects/action'
import { ProjectList } from './project-list'
import { Button } from '@/components/ui/button'

import Link from 'next/link'
import { LayoutGridIcon, LayoutList, PlusIcon } from 'lucide-react'
import { ProjectProvider } from '@/components/providers/project';
import ProjectHeader from './components/project-header'

export default async function ProjectsPage() {
  const { data: projects, error } = await getProjectsAction()

  console.log("projects",projects)

  return (
    <ProjectProvider>
      <div className="mx-auto max-w-[1400px] px-2 md:px-4">
        <ProjectHeader />

        {error ? (
          <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-4">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        ) : (
          <ProjectList projects={projects || []} />
        )}
      </div>
    </ProjectProvider>
  )
}