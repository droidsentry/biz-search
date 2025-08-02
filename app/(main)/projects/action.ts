'use server'

import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types/database'

type ProjectWithFullStats = Tables<'projects'> & {
  total_properties: number | string  // PostgreSQLのBIGINTはJavaScriptで文字列として扱われることがある
  total_owners: number | string
  pending_owners: number | string    // 追加: 調査前
  completed_owners: number | string  // 調査済のみ
  unknown_owners: number | string    // 追加: 不明
  owner_progress: number
  last_updated_at: string | null     // 追加: 最終更新日
  last_updated_by_username: string | null  // 追加: 最終更新者
}

export async function getProjectsWithProgress() {
  const supabase = await createClient()
  
  // 認証確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('認証が必要です')
  }

  // RPC関数を使用してプロジェクトと進捗情報を取得
  const { data: projectsWithStats, error } = await supabase
    .rpc('get_projects_with_full_stats')
    .overrideTypes<ProjectWithFullStats[], { merge: false }>()

  if (error) {
    console.error('プロジェクト進捗取得エラー:', error.message)
    throw new Error('プロジェクトの取得に失敗しました')
  }

  // console.log('projectsWithStats', projectsWithStats)

  // フロントエンドが期待する形式に変換
  return (projectsWithStats || []).map(project => ({
    ...project,
    totalProperties: Number(project.total_properties),
    totalOwners: Number(project.total_owners),
    pendingOwners: Number(project.pending_owners),
    completedOwners: Number(project.completed_owners),
    unknownOwners: Number(project.unknown_owners),
    completedProperties: Number(project.completed_owners), // 互換性のため（所有者の完了数）
    progress: Number(project.owner_progress), // 所有者ベースの進捗
    lastUpdatedAt: project.last_updated_at,
    lastUpdatedByUsername: project.last_updated_by_username,
  }))
}