import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types/database'
import { 
  ProjectPropertyView, 
  ProjectStats,
  transformProjectPropertyView, 
  transformProjectStats 
} from '@/lib/types/rpc'

// 物件ベース表示用の型（共有者を集約）
export type PropertyWithPrimaryOwner = ProjectPropertyView

// 所有者ベース表示用の型（共有者を個別に表示）
export type PropertyWithOwnerAndCompany = {
  project_property_id: string
  property_id: string
  property_address: string
  added_at: string
  import_source_file: string | null
  ownership_id: string
  ownership_start: string
  owner: {
    id: string
    name: string
    address: string
    lat: number | null
    lng: number | null
    street_view_available: boolean | null
    investigation_status: 'pending' | 'completed' | 'unknown' | null
    created_at: string
    updated_at: string
    company: {
      id: string | null
      name: string | null
      number: string | null
      rank: number | null
    } | null
    companies_count: number
  }
}

type ProjectPropertiesResponse = {
  data: PropertyWithPrimaryOwner[] | null
  error: string | null
}

type ProjectOwnersResponse = {
  data: PropertyWithOwnerAndCompany[] | null
  error: string | null
}

/**
 * プロジェクトの物件一覧を取得（物件ベース - 共有者を集約）
 * @param projectId プロジェクトID
 * @returns 物件一覧
 * RPC関数で取得: get_project_properties_view
 */
export async function getProjectProperties(
  projectId: string
): Promise<ProjectPropertiesResponse> {
  try {
    const supabase = await createClient()
    
    // 認証確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: '認証が必要です' }
    }

    // RPC関数を使用して物件ベースのデータを取得
    const { data, error } = await supabase
      .rpc('get_project_properties_view', { p_project_id: projectId })

    if (error) {
      console.error('物件一覧取得エラー:', error)
      return { data: null, error: error.message || 'データの取得に失敗しました' }
    }

    // データを整形（camelCaseに変換）
    const formattedData: PropertyWithPrimaryOwner[] = (data || []).map(transformProjectPropertyView)

    return { data: formattedData, error: null }
  } catch (error) {
    console.error('予期せぬエラー:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '予期せぬエラーが発生しました' 
    }
  }
}

// プロジェクトの物件一覧を取得（所有者ベース - 共有者を個別表示）
export async function getProjectOwners(
  projectId: string
): Promise<ProjectOwnersResponse> {
  try {
    const supabase = await createClient()
    
    // 認証確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: '認証が必要です' }
    }

    // RPC関数を使用して所有者ベースのデータを取得
    const { data, error } = await supabase
      .rpc('get_project_owners_view', { p_project_id: projectId })

    if (error) {
      console.error('所有者一覧取得エラー:', error)
      return { data: null, error: error.message || 'データの取得に失敗しました' }
    }

    // データを整形
    const formattedData: PropertyWithOwnerAndCompany[] = (data || []).map(item => ({
      project_property_id: item.project_property_id,
      property_id: item.property_id,
      property_address: item.property_address,
      added_at: item.added_at,
      import_source_file: item.import_source_file,
      ownership_id: item.ownership_id,
      ownership_start: item.ownership_start,
      owner: {
        id: item.owner_id,
        name: item.owner_name,
        address: item.owner_address,
        lat: item.owner_lat,
        lng: item.owner_lng,
        street_view_available: item.owner_street_view_available,
        investigation_status: item.owner_investigation_status,
        created_at: item.owner_created_at,
        updated_at: item.owner_updated_at,
        company: item.company_id ? {
          id: item.company_id,
          name: item.company_name,
          number: item.company_number,
          rank: item.company_rank
        } : null,
        companies_count: Number(item.owner_companies_count)
      }
    }))

    return { data: formattedData, error: null }
  } catch (error) {
    console.error('予期せぬエラー:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '予期せぬエラーが発生しました' 
    }
  }
}

// プロジェクト詳細を取得
export async function getProject(
  projectId: string
): Promise<{ data: Tables<'projects'> | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // 認証確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: '認証が必要です' }
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('プロジェクト取得エラー:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('予期せぬエラー:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '予期せぬエラーが発生しました' 
    }
  }
}

/**
 * プロジェクトの統計情報を取得
 * @param projectId プロジェクトID
 * @returns 統計情報
 * RPC関数で取得: get_project_stats
 */
export async function getProjectStats(
  projectId: string
): Promise<{ 
  data: ProjectStats | null; 
  error: string | null 
}> {
  try {
    const supabase = await createClient()
    
    // 認証確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: '認証が必要です' }
    }

    // プロジェクトの統計情報を取得
    const { data, error } = await supabase
      .rpc('get_project_stats', { p_project_id: projectId })
      .single()

    if (error) {
      console.error('統計情報取得エラー:', error)
      return { data: null, error: error.message }
    }

    return { 
      data: transformProjectStats(data),
      error: null 
    }
  } catch (error) {
    console.error('予期せぬエラー:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '予期せぬエラーが発生しました' 
    }
  }
}