import { z } from "zod";
import {
  createProjectSchema,
  propertyDataSchema,
  savePropertiesSchema,
  ownerCompanySchema,
  addMemberSchema,
} from "@/lib/schemas/property";
import { Tables, TablesInsert, TablesUpdate } from "./database";

// プロジェクト作成フォームデータ型
export type CreateProjectFormData = z.infer<typeof createProjectSchema>;

// 物件データ型（UIからの入力用）
export type PropertyData = z.infer<typeof propertyDataSchema>;

// 物件一括保存データ型
export type SavePropertiesData = z.infer<typeof savePropertiesSchema>;

// 会社情報型
export type OwnerCompanyData = z.infer<typeof ownerCompanySchema>;

// メンバー追加データ型
export type AddMemberData = z.infer<typeof addMemberSchema>;

// データベーステーブルの型定義（Row型）
export type Property = Tables<'properties'>;
export type Owner = Tables<'owners'>;
export type Project = Tables<'projects'>;
export type PropertyOwnership = Tables<'property_ownerships'>;
export type ProjectProperty = Tables<'project_properties'>;
export type OwnerCompany = Tables<'owner_companies'>;
export type Profile = Tables<'profiles'>;
export type ProjectMember = Tables<'project_members'>;

// データベーステーブルの型定義（Insert型）
export type PropertyInsert = TablesInsert<'properties'>;
export type OwnerInsert = TablesInsert<'owners'>;
export type ProjectInsert = TablesInsert<'projects'>;
export type PropertyOwnershipInsert = TablesInsert<'property_ownerships'>;
export type ProjectPropertyInsert = TablesInsert<'project_properties'>;
export type OwnerCompanyInsert = TablesInsert<'owner_companies'>;

// データベーステーブルの型定義（Update型）
export type PropertyUpdate = TablesUpdate<'properties'>;
export type OwnerUpdate = TablesUpdate<'owners'>;
export type ProjectUpdate = TablesUpdate<'projects'>;
export type PropertyOwnershipUpdate = TablesUpdate<'property_ownerships'>;
export type ProjectPropertyUpdate = TablesUpdate<'project_properties'>;
export type OwnerCompanyUpdate = TablesUpdate<'owner_companies'>;

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
  savedCount: number;
  errors?: Array<{
    index: number;
    propertyAddress: string;
    error: string;
  }>;
}
