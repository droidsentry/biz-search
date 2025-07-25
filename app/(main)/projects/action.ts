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

        // 調査完了した物件数を取得
        // project_properties -> properties -> property_ownerships -> owners の順でJOINし、
        // investigation_completed = true の数をカウント
        const { count: completedProperties, error: completedError } = await supabase
          .from('project_properties')
          .select(`
            id,
            property:properties!inner (
              id,
              property_ownerships!inner (
                is_current,
                owner:owners!inner (
                  investigation_completed
                )
              )
            )
          `, { count: 'exact', head: true })
          .eq('project_id', project.id)
          .eq('property.property_ownerships.is_current', true)
          .eq('property.property_ownerships.owner.investigation_completed', true)

        if (completedError) {
          console.error('完了物件数取得エラー:', completedError)
        }

        const progress = totalProperties && totalProperties > 0 
          ? Math.round(((completedProperties || 0) / totalProperties) * 100)
          : 0

        return {
          ...project,
          totalProperties: totalProperties || 0,
          completedProperties: completedProperties || 0,
          progress
        }
      })
    )

    return projectsWithProgress
}