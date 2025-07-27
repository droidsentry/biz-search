import {
  createProjectSchema,
  propertyDataSchema,
  savePropertiesSchema,
} from "@/lib/schemas/property";
import { z } from "zod";

// プロジェクト作成フォームデータ型
export type CreateProjectFormData = z.infer<typeof createProjectSchema>;

// 物件データ型（UIからの入力用）
export type PropertyData = z.infer<typeof propertyDataSchema>;

// 物件一括保存データ型
export type SavePropertiesData = z.infer<typeof savePropertiesSchema>;

// データベーステーブルの型定義（Row型）
// export type Property = Tables<'properties'>;
// export type Owner = Tables<'owners'>;
// export type Project = Tables<'projects'>;
// export type PropertyOwnership = Tables<'property_ownerships'>;
// export type ProjectProperty = Tables<'project_properties'>;
// export type OwnerCompany = Tables<'owner_companies'>;
// export type Profile = Tables<'profiles'>;
// export type ProjectMember = Tables<'project_members'>;

// PDFインポート用の型定義
export interface PDFPropertyData {
  propertyAddress: string;
  ownerName: string;
  ownerAddress: string;
  lat?: number | null;
  lng?: number | null;
  streetViewAvailable?: boolean;
  sourceFileName: string;
}

// インポート結果の型定義
export interface ImportResult {
  success: boolean;
  importedCount: number;
  errors: Array<{
    propertyAddress: string;
    error: string;
  }>;
}

// 保存レスポンス型
export interface SavePropertiesResponse {
  success: boolean;
  projectId: string;
  projectName?: string;
  savedCount: number;
  errors?: Array<{
    index: number;
    propertyAddress: string;
    error: string;
  }>;
}

// RPC関数のレスポンス型
export interface CreateProjectAndImportResponse {
  success: boolean;
  projectId: string;
  projectName: string;
  totalCount: number;
  importedCount: number;
  errorCount: number;
  errors: Array<{
    error: string;
    detail?: string;
  }>;
}

// 保存進捗の型
export interface SaveProgress {
  phase: 'uploading' | 'processing' | 'completed';
  progress: number;
  currentBatch?: number;
  totalBatches?: number;
}
