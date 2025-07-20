'use server'

import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types/database'

export type ProjectWithProgress = Tables<'projects'> & {
  totalProperties: number
  completedProperties: number
  progress: number
}

export async function getProjectsAction(): Promise<{
  data: ProjectWithProgress[] | null
  error: string | null
}> {
  const supabase = await createClient()
  
  // 認証確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: '認証が必要です' }
  }

  try {
    // プロジェクト一覧を取得
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (projectsError) {
      console.error('プロジェクト取得エラー:', projectsError)
      return { data: null, error: 'プロジェクトの取得に失敗しました' }
    }

    if (!projects || projects.length === 0) {
      return { data: [], error: null }
    }

    // 各プロジェクトの進捗を計算
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        // プロジェクトに紐づく物件数を取得
        const { count: totalProperties, error: countError } = await supabase
          .from('project_properties')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id)

        if (countError) {
          console.error('物件数取得エラー:', countError)
          return {
            ...project,
            totalProperties: 0,
            completedProperties: 0,
            progress: 0
          }
        }

        // TODO: 完了した物件数を取得する（現在は仮の実装）
        // 実際の実装では、物件の調査ステータスなどを基に計算する
        const completedProperties = Math.floor((totalProperties || 0) * 0.3) // 仮の実装：30%完了

        const progress = totalProperties && totalProperties > 0 
          ? Math.round((completedProperties / totalProperties) * 100)
          : 0

        return {
          ...project,
          totalProperties: totalProperties || 0,
          completedProperties,
          progress
        }
      })
    )

    return { data: projectsWithProgress, error: null }
  } catch (error) {
    console.error('プロジェクト取得エラー:', error)
    return { data: null, error: '予期せぬエラーが発生しました' }
  }
}

export async function getProjectAction(projectId: string): Promise<{
  data: ProjectWithProgress | null
  error: string | null
}> {
  const supabase = await createClient()
  
  // 認証確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: '認証が必要です' }
  }

  try {
    // プロジェクトを取得
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) {
      console.error('プロジェクト取得エラー:', projectError)
      return { data: null, error: 'プロジェクトの取得に失敗しました' }
    }

    if (!project) {
      return { data: null, error: 'プロジェクトが見つかりません' }
    }

    // プロジェクトに紐づく物件数を取得
    const { count: totalProperties, error: countError } = await supabase
      .from('project_properties')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project.id)

    if (countError) {
      console.error('物件数取得エラー:', countError)
    }

    // TODO: 完了した物件数を取得する
    const completedProperties = Math.floor((totalProperties || 0) * 0.3) // 仮の実装

    const progress = totalProperties && totalProperties > 0 
      ? Math.round((completedProperties / totalProperties) * 100)
      : 0

    return {
      data: {
        ...project,
        totalProperties: totalProperties || 0,
        completedProperties,
        progress
      },
      error: null
    }
  } catch (error) {
    console.error('プロジェクト取得エラー:', error)
    return { data: null, error: '予期せぬエラーが発生しました' }
  }
}