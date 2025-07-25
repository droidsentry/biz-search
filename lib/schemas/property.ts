import { z } from "zod";
import AwesomeDebouncePromise from "awesome-debounce-promise";
import { checkProjectName } from "@/lib/actions/property";


/**
 * プロジェクト説明スキーマ
 */
const descriptionSchema = z
    .string()
    .trim()
    .max(500, "説明は500文字以内で入力してください")
    .optional()

/**
 * プロジェクト名スキーマ
 * サーバーアクション用（デバウンスなし）
 */
const projectNameWithUniquenessCheckSchema = z
  .string()
  .trim()
  .min(1, "プロジェクト名は1文字以上で入力してください") // エンドユーザーの操作性向上のため、制限を１文字に変更
  .max(100, "プロジェクト名は100文字以内で入力してください")
  .refine(async (name) => await checkProjectName(name),{
    message: "このプロジェクト名は既に使用されています",
  });

/**
 * フロントエンド用（デバウンス付き）
 */
const debouncedProjectNameWithUniquenessCheckSchema = z
  .string()
  .trim()
  .min(1, "プロジェクト名は1文字以上で入力してください") // エンドユーザーの操作性向上のため、制限を１文字に変更
  .max(100, "プロジェクト名は100文字以内で入力してください")
  .refine(
    AwesomeDebouncePromise(
      async (name) => await checkProjectName(name),
      500 // エンドユーザーの操作性向上のため、デバウンスを500msに変更
    ),
    {
      message: "このプロジェクト名は既に使用されています",
    }
  );

/**
 * プロジェクト作成スキーマ
 * サーバーアクション用（デバウンスなし）
 */
export const createProjectSchema = z.object({
  name: projectNameWithUniquenessCheckSchema,
  description:descriptionSchema,
});
/**
 * フロントエンド用の拡張プロジェクト作成スキーマ
 * デバウンスを使用したバリデーションを行う。
 */
export const extendedCreateProjectSchema = createProjectSchema.extend({
  name: debouncedProjectNameWithUniquenessCheckSchema,
});




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
  projectId: z.uuid("不正なプロジェクトIDです"),
  properties: z.array(propertyDataSchema).min(1, "保存する物件データがありません"),
});


