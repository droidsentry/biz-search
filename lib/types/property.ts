import { z } from "zod";
import {
  createProjectSchema,
  propertyDataSchema,
  savePropertiesSchema,
  importLogSchema,
  ownerCompanySchema,
  addMemberSchema,
} from "@/lib/schemas/property";
import { Database, Tables } from "./database";

// プロジェクト作成フォームデータ型
export type CreateProjectFormData = z.infer<typeof createProjectSchema>;

// 物件データ型
export type PropertyData = z.infer<typeof propertyDataSchema>;

// 物件一括保存データ型
export type SavePropertiesData = z.infer<typeof savePropertiesSchema>;

// インポートログ型
export type ImportLogData = z.infer<typeof importLogSchema>;

// 会社情報型
export type OwnerCompanyData = z.infer<typeof ownerCompanySchema>;

// メンバー追加データ型
export type AddMemberData = z.infer<typeof addMemberSchema>;

// データベースのプロジェクト型
export interface Project {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// データベースのプロパティ型
export interface Property {
  id: string;
  project_id: string;
  property_address: string;
  owner_id: string | null;
  source_file_name: string | null;
  lat: number | null;
  lng: number | null;
  street_view_available: boolean | null;
  imported_at: string;
  imported_by: string;
  created_at: string;
  updated_at: string;
}

// データベースの所有者型
export interface Owner {
  id: string;
  name: string;
  address: string;
  created_at: string;
  updated_at: string;
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

// export type OwnerType = Database['public']['Tables']['owners']['Row'] メモ
