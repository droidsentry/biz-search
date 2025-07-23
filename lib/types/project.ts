import { getProjectsWithProgress } from "@/app/(main)/projects/action";


export type ProjectWithProgress = Awaited<
ReturnType<typeof getProjectsWithProgress>
>[number];
