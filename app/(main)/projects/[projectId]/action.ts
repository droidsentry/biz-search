'use server'

import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types/database'

export type PropertyWithOwnerAndCompany = {
  id: string
  address: string
  added_at: string
  import_source_file: string | null
  current_ownership: {
    id: string
    ownership_start: string
    updated_at: string
    owner: {
      id: string
      name: string
      address: string
      lat: number | null
      lng: number | null
      street_view_available: boolean | null
      created_at: string
      updated_at: string
      company?: Tables<'owner_companies'> | null
    }
  } | null
}

export type ProjectPropertiesResponse = {
  data: PropertyWithOwnerAndCompany[] | null
  error: string | null
}

// プロジェクトの物件一覧を取得
export async function getProjectPropertiesAction(
  projectId: string
): Promise<ProjectPropertiesResponse> {
  try {
    const supabase = await createClient()
    
    // 認証確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: '認証が必要です' }
    }

    // プロジェクトの物件を取得（現在の所有者情報と会社情報を含む）
    const { data, error } = await supabase
      .from('project_properties')
      .select(`
        id,
        added_at,
        import_source_file,
        property:properties!inner (
          id,
          address
        )
      `)
      .eq('project_id', projectId)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('物件一覧取得エラー:', error)
      return { data: null, error: error.message }
    }

    // 各物件の現在の所有者情報を取得
    const propertiesWithOwners = await Promise.all(
      (data || []).map(async (item) => {
        const { data: ownershipData } = await supabase
          .from('property_ownerships')
          .select(`
            id,
            ownership_start,
            updated_at,
            owner:owners!inner (
              id,
              name,
              address,
              lat,
              lng,
              street_view_available,
              created_at,
              updated_at
            )
          `)
          .eq('property_id', item.property.id)
          .eq('is_current', true)
          .single()

        // 所有者の会社情報を取得（rank=1のみ）
        let ownerWithCompany = null
        if (ownershipData?.owner) {
          const { data: companyData } = await supabase
            .from('owner_companies')
            .select('*')
            .eq('owner_id', ownershipData.owner.id)
            .eq('rank', 1)
            .single()

          ownerWithCompany = {
            ...ownershipData.owner,
            created_at: ownershipData.owner.created_at || new Date().toISOString(),
            updated_at: ownershipData.owner.updated_at || new Date().toISOString(),
            company: companyData
          }
        }

        return {
          id: item.id,
          address: item.property.address,
          added_at: item.added_at,
          import_source_file: item.import_source_file,
          current_ownership: ownershipData && ownerWithCompany ? {
            ...ownershipData,
            owner: ownerWithCompany
          } : null
        }
      })
    )

    return { data: propertiesWithOwners, error: null }
  } catch (error) {
    console.error('予期せぬエラー:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '予期せぬエラーが発生しました' 
    }
  }
}

// CSVエクスポート用のデータ取得
export async function exportProjectPropertiesToCSV(
  projectId: string
): Promise<{ data: string | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // 認証確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: '認証が必要です' }
    }

    // エクスポート用の関数を呼び出し
    const { data, error } = await supabase.rpc('get_project_export_data', {
      p_project_id: projectId
    })

    if (error) {
      console.error('エクスポートエラー:', error)
      return { data: null, error: error.message }
    }

    // CSVフォーマットに変換
    const headers = [
      '物件住所',
      '所有者名',
      '所有者住所',
      '所有者緯度',
      '所有者経度',
      '会社名',
      '法人番号',
      '役職',
      '所有開始日',
      'インポート日時',
      '調査日時'
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = data.map((row: any) => [
      row.property_address || '',
      row.owner_name || '',
      row.owner_address || '',
      row.owner_lat || '',
      row.owner_lng || '',
      row.company_1_name || '',
      row.company_1_number || '',
      row.company_1_position || '',
      row.ownership_start || '',
      row.import_date || '',
      row.researched_date || ''
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // BOMを追加（Excelでの文字化け対策）
    const bom = '\uFEFF'
    return { data: bom + csv, error: null }
  } catch (error) {
    console.error('予期せぬエラー:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '予期せぬエラーが発生しました' 
    }
  }
}

// プロジェクト詳細を取得
export async function getProjectAction(
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