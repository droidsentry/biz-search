# サーバーアクション実装パターン

## 基本的なサーバーアクション

```tsx
// app/actions/auth.actions.ts
"use server";

import { loginSchema } from "@/lib/schemas/auth.schema";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  // 1. 必ず認証確認
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 認証が必要なアクションの場合
  if (!user && requiresAuth) {
    redirect("/login");
  }

  // 2. 必ずsafeParseでデータ検証 ※検証が非同期の時はsafeParseAsync
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    console.log("バリデーションエラー", parsed.error);
    throw new Error("バリデーション");
  }
  const { data, error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    console.error("認証エラー", error);
  }

  return data;
}
```

## データ作成アクション

```tsx
// app/actions/product.actions.ts
"use server";

import { productSchema } from "@/lib/schemas/product.schema";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProductAction(formData: FormData) {
  // 認証確認
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // データ検証
  const result = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: Number(formData.get("price")),
  });

  if (!result.success) {
    console.log("バリデーションエラー", result.error);
    throw new Error("バリデーション");
  }

  // データ作成
  const { data, error } = await supabase
    .from("products")
    .insert({
      ...result.data,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.log("データ作成エラー", error.message);
    throw new Error("データ作成エラー");
  }

  // キャッシュの再検証
  revalidatePath("/products");
  return data;
}
```

## 重要なポイント

1. **必ず認証確認を行う**
2. **必ず safeParse でデータ検証**
3. **適切なエラーハンドリング**
4. **revalidatePath でキャッシュ更新**
