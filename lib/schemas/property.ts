import { z } from "zod";
import AwesomeDebouncePromise from "awesome-debounce-promise";

// プロジェクト作成スキーマ
export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "プロジェクト名は3文字以上で入力してください")
    .max(100, "プロジェクト名は100文字以内で入力してください")
    .regex(
      /^[a-zA-Z0-9ぁ-んァ-ヶー一-龠々〆〤〥〦〧〨〩〪〭〮〫〬\s\-_]+$/,
      "使用できない文字が含まれています"
    ),
  description: z
    .string()
    .trim()
    .max(500, "説明は500文字以内で入力してください")
    .optional(),
});

// プロジェクト名重複チェック用の関数（後で実装）
export const isProjectNameUnique = async (name: string): Promise<boolean> => {
  // この関数は後でサーバーアクションで実装
  return true;
};

// デバウンス付きプロジェクト名重複チェックスキーマ
export const projectNameWithUniquenessCheckSchema = z
  .string()
  .trim()
  .min(3, "プロジェクト名は3文字以上で入力してください")
  .max(100, "プロジェクト名は100文字以内で入力してください")
  .regex(
    /^[a-zA-Z0-9ぁ-んァ-ヶー一-龠々〆〤〥〦〧〨〩〪〭〮〫〬\s\-_]+$/,
    "使用できない文字が含まれています"
  )
  .refine(
    AwesomeDebouncePromise(
      async (name) => await isProjectNameUnique(name),
      500
    ),
    {
      message: "このプロジェクト名は既に使用されています",
    }
  );

// 物件データ保存用スキーマ
export const propertyDataSchema = z.object({
  propertyAddress: z.string().min(1, "物件住所は必須です"),
  ownerName: z.string().min(1, "所有者名は必須です"),
  ownerAddress: z.string().min(1, "所有者住所は必須です"),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  streetViewAvailable: z.boolean().optional(),
  sourceFileName: z.string().optional(),
});

// 物件一括保存スキーマ
export const savePropertiesSchema = z.object({
  projectId: z.string().uuid("不正なプロジェクトIDです"),
  properties: z.array(propertyDataSchema).min(1, "保存する物件データがありません"),
});

// インポートログスキーマ
export const importLogSchema = z.object({
  projectId: z.string().uuid(),
  fileCount: z.number().int().min(0),
  propertyCount: z.number().int().min(0),
  successCount: z.number().int().min(0),
  errorCount: z.number().int().min(0),
});

// 会社情報スキーマ
export const ownerCompanySchema = z.object({
  ownerId: z.string().uuid(),
  companyName: z.string().min(1, "会社名は必須です"),
  companyNumber: z.string().optional(),
  position: z.string().optional(),
  sourceUrl: z.string().url("有効なURLを入力してください"),
  rank: z.number().int().min(1).max(3),
});

// メンバー追加スキーマ
export const addMemberSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["owner", "editor", "viewer"]),
});