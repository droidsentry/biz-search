// PDF解析関連の型定義

// 不動産情報（property-parserのPropertyOwnerと同じ構造）
export interface PropertyData {
  recordDate: string      // 記録日時（ISO形式）
  propertyAddress: string // 物件住所
  ownerName: string      // 所有者名
  ownerAddress: string   // 所有者住所
  ownerNameWarning?: string // 所有者名の警告（文字欠損など）
  isOwnerNameCorrupted?: boolean // 所有者名が文字化けしているか
  ownerAddressWarning?: string // 所有者住所の警告（文字欠損など）
  isOwnerAddressCorrupted?: boolean // 所有者住所が文字化けしているか
}

// 解析結果
export interface ParseResult {
  fileName: string
  fileSize: number
  status: 'success' | 'error'
  pageCount?: number
  textLength?: number
  processingTime: number
  propertyData?: PropertyData[]
  error?: string
}

// フォームの状態
export type ImportStep = 'upload' | 'confirm' | 'processing' | 'complete'

// ジオコーディング結果
export interface GeocodingResult {
  lat?: number
  lng?: number
  formattedAddress?: string
  streetViewAvailable?: boolean
  error?: string
  loading?: boolean
}