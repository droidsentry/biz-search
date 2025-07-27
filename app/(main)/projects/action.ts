'use server'

import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types/database'

type ProjectWithFullStats = Tables<'projects'> & {
  total_properties: number
  total_owners: number
  completed_owners: number
  owner_progress: number
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
    .returns<ProjectWithFullStats[]>()

  if (error) {
    console.error('プロジェクト進捗取得エラー:', error.message)
    throw new Error('プロジェクトの取得に失敗しました')
  }

  // フロントエンドが期待する形式に変換
  return (projectsWithStats || []).map(project => ({
    ...project,
    totalProperties: project.total_properties,
    totalOwners: project.total_owners,
    completedProperties: project.completed_owners, // 互換性のため（所有者の完了数）
    progress: project.owner_progress, // 所有者ベースの進捗
  }))
}