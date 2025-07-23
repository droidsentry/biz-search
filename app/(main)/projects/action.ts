'use server'

import { createClient } from '@/lib/supabase/server'

export async function getProjectsWithProgress() {

  const supabase = await createClient()
  // 認証確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('認証が必要です')
  }

    const { data: projects, error} = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !projects) {
      console.error('プロジェクト取得エラー:', error.message)
      throw new Error('プロジェクトの取得に失敗しました')
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

    return projectsWithProgress
}