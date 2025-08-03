import { Database } from './database'

// RPC関数の戻り値から派生した型を定義
// get_project_stats の型
export type ProjectStatsRaw = Database['public']['Functions']['get_project_stats']['Returns'][0]

export type ProjectStats = {
  totalProperties: number
  totalOwners: number
  pendingOwners: number
  completedOwners: number
  unknownOwners: number
  ownerProgress: number
}

// get_project_properties_view の型
export type ProjectPropertyViewRaw = Database['public']['Functions']['get_project_properties_view']['Returns'][0]

export type ProjectPropertyView = {
  projectPropertyId: string
  propertyId: string
  propertyAddress: string
  addedAt: string
  importSourceFile: string | null
  ownerCount: number
  primaryOwner: {
    id: string
    name: string
    address: string
    lat: number | null
    lng: number | null
    streetViewAvailable: boolean | null
    investigationStatus: Database['public']['Enums']['investigation_status'] | null
    updatedAt: string
    updatedByUsername: string | null
    company: {
      id: string
      name: string
      updatedAt: string
      researchedByUsername: string | null
    } | null
    companiesCount: number
  } | null
}

// 型変換ヘルパー関数
export function transformProjectStats(raw: ProjectStatsRaw): ProjectStats {
  return {
    totalProperties: raw.total_properties,
    totalOwners: raw.total_owners,
    pendingOwners: raw.pending_owners,
    completedOwners: raw.completed_owners,
    unknownOwners: raw.unknown_owners,
    ownerProgress: raw.owner_progress
  }
}

export function transformProjectPropertyView(raw: ProjectPropertyViewRaw): ProjectPropertyView {
  return {
    projectPropertyId: raw.project_property_id,
    propertyId: raw.property_id,
    propertyAddress: raw.property_address,
    addedAt: raw.added_at,
    importSourceFile: raw.import_source_file,
    ownerCount: raw.owner_count,
    primaryOwner: raw.primary_owner_id ? {
      id: raw.primary_owner_id,
      name: raw.primary_owner_name,
      address: raw.primary_owner_address,
      lat: raw.primary_owner_lat,
      lng: raw.primary_owner_lng,
      streetViewAvailable: raw.primary_owner_street_view_available,
      investigationStatus: raw.primary_owner_investigation_status,
      updatedAt: raw.primary_owner_updated_at,
      updatedByUsername: raw.primary_owner_updated_by_username,
      company: raw.primary_company_id ? {
        id: raw.primary_company_id,
        name: raw.primary_company_name,
        updatedAt: raw.primary_company_updated_at,
        researchedByUsername: raw.primary_company_researched_by_username
      } : null,
      companiesCount: raw.primary_owner_companies_count
    } : null
  }
}