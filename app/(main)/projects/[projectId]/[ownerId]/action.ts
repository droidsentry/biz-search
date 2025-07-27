'use server'

import { createClient } from '@/lib/supabase/server'
import { Tables, TablesInsert } from '@/lib/types/database'

export type OwnerWithCompaniesAndProperties = {
  id: string
  name: string
  address: string
  lat: number | null
  lng: number | null
  street_view_available: boolean | null
  investigation_completed: boolean | null
  created_at: string
  updated_at: string
  companies: Tables<'owner_companies'>[]
  properties: {
    id: string
    address: string
    project_id: string
  }[]
}

type OwnerDetailsResponse = {
  data: OwnerWithCompaniesAndProperties | null
  error: string | null
}

// 所有者詳細情報を取得
export async function getOwnerDetailsAction(
  projectId: string,
  ownerId: string
): Promise<OwnerDetailsResponse> {
  try {
    const supabase = await createClient()
    
    // 認証確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: '認証が必要です' }
    }

    // 所有者基本情報を取得
    const { data: ownerData, error: ownerError } = await supabase
      .from('owners')
      .select('*')
      .eq('id', ownerId)
      .single()

    if (ownerError) {
      console.error('所有者情報取得エラー:', ownerError)
      return { data: null, error: '所有者情報の取得に失敗しました' }
    }

    // 会社情報を取得（rank順）
    const { data: companiesData, error: companiesError } = await supabase
      .from('owner_companies')
      .select('*')
      .eq('owner_id', ownerId)
      .order('rank', { ascending: true })

    if (companiesError) {
      console.error('会社情報取得エラー:', companiesError)
    }

    // このプロジェクトで所有者が所有している物件を取得
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('property_ownerships')
      .select(`
        property:properties!inner (
          id,
          address
        )
      `)
      .eq('owner_id', ownerId)
      .eq('is_current', true)

    if (propertiesError) {
      console.error('物件情報取得エラー:', propertiesError)
    }

    // プロジェクトに関連する物件のみフィルタリング
    const projectProperties = []
    if (propertiesData) {
      for (const ownership of propertiesData) {
        const { data: projectProperty } = await supabase
          .from('project_properties')
          .select('project_id')
          .eq('project_id', projectId)
          .eq('property_id', ownership.property.id)
          .single()

        if (projectProperty) {
          projectProperties.push({
            id: ownership.property.id,
            address: ownership.property.address,
            project_id: projectId
          })
        }
      }
    }

    // アクセス権限確認（このプロジェクトに関連する所有者か）
    if (projectProperties.length === 0) {
      // プロジェクトに関連する物件を所有していない場合はアクセス権限なし
      return { data: null, error: 'アクセス権限がありません' }
    }

    const owner: OwnerWithCompaniesAndProperties = {
      ...ownerData,
      companies: companiesData || [],
      properties: projectProperties
    }

    return { data: owner, error: null }
  } catch (error) {
    console.error('予期せぬエラー:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '予期せぬエラーが発生しました' 
    }
  }
}

/**
 * 会社情報を更新
 * @param ownerId 所有者ID
 * @param companyData 会社情報
 * @returns 成功したかどうか
 */
export async function updateOwnerCompanyAction(
  ownerId: string,
  companyData: {
    companyName: string
    companyNumber?: string
    sourceUrl: string
    rank: 1 | 2 | 3
  }
) {
    const supabase = await createClient()
    // 認証確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('認証が必要です')
    }

    const insertData: TablesInsert<'owner_companies'> = {
      owner_id: ownerId,
      company_name: companyData.companyName,
      company_number: companyData.companyNumber || null,
      source_url: companyData.sourceUrl,
      rank: companyData.rank,
      researched_by: user.id
    }

    const { error } = await supabase
      .from('owner_companies')
      .upsert(insertData, {
        onConflict: 'owner_id,rank'
      })

    if (error) {
      console.error('会社情報更新エラー:', error)
      throw new Error('会社情報の更新に失敗しました')
    }

    return true
}

/**
 * 会社情報を削除
 * @param ownerId 所有者ID
 * @param rank 会社情報のランク
 * @returns 成功したかどうか
 */
export async function deleteOwnerCompanyAction(
  ownerId: string,
  rank: 1 | 2 | 3
) {
    const supabase = await createClient()
    // 認証確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('認証が必要です')
    }

    const { error } = await supabase
      .from('owner_companies')
      .delete()
      .eq('owner_id', ownerId)
      .eq('rank', rank)

    if (error) {
      console.error('会社情報削除エラー:', error)
      throw new Error('会社情報の削除に失敗しました エラー:' + error.message)
    }

    return true
}