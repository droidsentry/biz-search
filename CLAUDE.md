# CLAUDE.md - AI開発支援ドキュメント

このドキュメントは、AI（Claude）がプロジェクトを理解し、効率的に開発支援を行うためのガイドラインです。

## プロジェクト概要

- **プロジェクト名**: Biz Search
- **目的**: ビジネス情報検索アプリケーション
- **デザイン方針**: Vercelのデザインシステムを踏襲
- **開発言語**: 日本語でのコミュニケーション（ターミナル出力含む）

## 技術スタック詳細

### フロントエンド
- **Next.js 15.4.1**: App Routerを使用
- **React 19.1.0**: 最新の機能を活用
- **TypeScript 5**: 厳格な型チェック（strict: true）
- **Tailwind CSS v4**: Oxide Engineによる高速化
- **shadcn/ui**: すべてのコンポーネントがインストール済み

### バックエンド
- **Supabase**: PostgreSQL + Row Level Security (RLS)
- **認証**: Supabase Auth
- **API**: Next.js API Routes（必要に応じて）

### 開発ツール
- **pnpm**: パッケージマネージャー
- **ESLint**: コード品質管理
- **Prettier**: コードフォーマット（要設定）
- **Turbopack**: 開発時の高速化

## コーディング規約

### 1. コンポーネント設計

```tsx
// ✅ サーバーコンポーネント（デフォルト）
export default async function ProductList() {
  const products = await getProducts()
  return <ProductGrid products={products} />
}

// ✅ クライアントコンポーネント（必要時のみ）
'use client'
export function InteractiveButton() {
  const [count, setCount] = useState(0)
  return <Button onClick={() => setCount(count + 1)}>Count: {count}</Button>
}
```

### 2. ファイル構造とネーミング

```
components/
├── ui/                    # shadcn/uiコンポーネント（変更しない）
├── forms/                 # フォーム専用コンポーネント
│   ├── LoginForm.tsx     # PascalCase
│   └── SearchForm.tsx
└── layouts/              # レイアウトコンポーネント
    ├── Header.tsx
    └── Footer.tsx

lib/
├── actions/              # サーバーアクション
│   ├── auth.ts
│   └── product.ts
├── supabase/
│   ├── client.ts         # クライアントサイド用
│   └── server.ts         # サーバーサイド用
├── schemas/              # Zodスキーマ
│   ├── auth.ts    # kebab-case + .schema.ts
│   └── product.ts
├── types/                # 型定義（z.infer<>で生成される型）
│   ├── auth.ts     # kebab-case + .types.ts
│   └── product.ts
└── hooks/                # カスタムフック
    ├── use-auth.ts       # use- プレフィックス
    └── use-products.ts

app/
└── api/                  # ルートハンドラー
```

### 3. フォーム実装パターン

```tsx
// lib/schemas/auth.schema.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

// lib/types/auth.types.ts
import { z } from 'zod'
import { loginSchema } from '@/lib/schemas/auth.schema'

export type LoginFormData = z.infer<typeof loginSchema>

// components/forms/LoginForm.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/lib/schemas/auth.schema'
import { LoginFormData } from '@/lib/types/auth.types'
import { loginAction } from '@/app/actions/auth.actions'

export function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('password', data.password)
    
    const result = await loginAction(formData)
    
    if (result.error) {
      // エラーハンドリング
    }
  }

  return (
    <Form {...form}>
      {/* フォーム実装 */}
    </Form>
  )
}
```

### 4. サーバーアクションパターン

```tsx
// app/actions/auth.actions.ts
'use server'

import { loginSchema } from '@/lib/schemas/auth.schema'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  // 1. 必ず認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 認証が必要なアクションの場合
  if (!user && requiresAuth) {
    redirect('/login')
  }

  // 2. 必ずsafeParseでデータ検証
  const result = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return { 
      error: '入力データが不正です',
      details: result.error.flatten() 
    }
  }

  // 3. 処理実行
  try {
    const { data, error } = await supabase.auth.signInWithPassword(result.data)
    
    if (error) {
      return { error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('ログインエラー:', error)
    return { error: '予期せぬエラーが発生しました' }
  }
}
```

### 5. ルートハンドラーパターン

```tsx
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { productSchema } from '@/lib/schemas/product.schema'

export async function POST(request: NextRequest) {
  // 1. 必ず認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    )
  }

  // 2. リクエストボディの検証
  const body = await request.json()
  const result = productSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: '入力データが不正です', details: result.error.flatten() },
      { status: 400 }
    )
  }

  // 3. 処理実行
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(result.data)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('製品作成エラー:', error)
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 }
    )
  }
}
```

### 6. データフェッチングとキャッシュ

```tsx
// SWRを使用したクライアントサイドフェッチング
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR('/api/products', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  return {
    products: data,
    isLoading,
    isError: !!error,
    mutate,
  }
}
```

### 7. Supabase使用パターン

```tsx
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

## 型定義のベストプラクティス

### Supabaseデータベース型の使用

Supabaseから取得するデータの型は、`@/lib/types/database.ts`から提供される型ヘルパーを使用すること。

```typescript
import { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'

// Row型（データ取得時）
type Owner = Tables<'owners'>
type Property = Tables<'properties'>
type Project = Tables<'projects'>

// Insert型（データ挿入時）
type OwnerInsert = TablesInsert<'owners'>
type PropertyInsert = TablesInsert<'properties'>
type ProjectInsert = TablesInsert<'projects'>

// Update型（データ更新時）
type OwnerUpdate = TablesUpdate<'owners'>
type PropertyUpdate = TablesUpdate<'properties'>
type ProjectUpdate = TablesUpdate<'projects'>

// 配列型
type OwnerArray = Tables<'owners'>[]
type PropertyArray = Tables<'properties'>[]
type ProjectArray = Tables<'projects'>[]
```

### 型定義の配置ルール

1. **データベーステーブルの型**: 直接`Tables<'テーブル名'>`を使用
2. **カスタム型定義**: `lib/types/`ディレクトリに配置
3. **Zodスキーマから生成される型**: `z.infer<typeof schema>`を使用

### 実装例

```typescript
// ❌ 悪い例
let owners: any[] = [];
const result: any = await supabase.from('owners').select();

// ✅ 良い例
import { Tables } from '@/lib/types/database'

let owners: Tables<'owners'>[] = [];
const { data, error } = await supabase
  .from('owners')
  .select()
  .returns<Tables<'owners'>[]>();
```

## エラーハンドリング

```tsx
// 一貫したエラーハンドリング
try {
  const result = await someOperation()
  return { success: true, data: result }
} catch (error) {
  console.error('操作に失敗しました:', error)
  return { 
    success: false, 
    error: error instanceof Error ? error.message : '予期せぬエラーが発生しました' 
  }
}
```

## テストとビルドコマンド

```bash
# 開発
pnpm dev

# ビルド前チェック
pnpm lint
pnpm typecheck  # 要追加

# ビルド
pnpm build

# テスト（要設定）
pnpm test
```

## Vercelデザインシステムの実装

### カラーパレット
- プライマリ: 黒（#000）
- セカンダリ: 白（#fff）
- アクセント: グレースケール
- エラー: 赤系統
- 成功: 緑系統

### タイポグラフィ
- フォント: Geist Sans / Geist Mono
- サイズ: Tailwindのデフォルトスケール使用

### コンポーネントスタイル
- 角丸: radius設定（0.625rem）
- シャドウ: 最小限の使用
- ボーダー: 細いグレーボーダー
- アニメーション: スムーズなトランジション

## AI開発支援のための重要事項

### 実装時の確認事項
1. **既存コードの確認**: 新機能実装前に関連ファイルを必ず確認
2. **命名規則の遵守**: 上記の命名規則に従う
3. **型安全性**: TypeScriptの型を最大限活用
4. **エラーハンドリング**: ユーザーフレンドリーなエラーメッセージ
5. **セキュリティ**: サーバーアクション・ルートハンドラーでは必ず認証確認とsafeParse実行

## Row Level Security (RLS) ベストプラクティス

### Supabase公式推奨のパフォーマンス最適化

#### 1. インデックスの活用
RLSポリシーで使用するカラムには必ずインデックスを作成する。

```sql
-- RLSで user_id を使用する場合
CREATE INDEX idx_table_user_id ON table_name(user_id);
```

#### 2. 関数呼び出しをselectでラップ
`auth.uid()`などの関数は`select`でラップすることで、Postgresのオプティマイザがステートメントごとに結果をキャッシュできる。

```sql
-- ✅ 推奨パターン
CREATE POLICY "Enable access" ON table
  USING (user_id = (select auth.uid()));
```

#### 3. 明示的なフィルタの追加
RLSポリシーに加えて、クエリでも明示的にフィルタを指定することで、より良いクエリプランが生成される。

```typescript
// ❌ 避けるべきパターン（RLSのみに依存）
const { data } = await supabase
  .from('table_name')
  .select('*');

// ✅ 推奨パターン（明示的なフィルタを追加）
const { data } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId);
```

#### 4. 結合の最小化
JOINを避け、配列とIN/ANY演算子を使用する。

```sql
-- ❌ 避けるべきパターン（JOINを使用）
CREATE POLICY "Check membership" ON posts
  USING (EXISTS (
    SELECT 1 FROM memberships 
    WHERE memberships.user_id = auth.uid() 
    AND memberships.group_id = posts.group_id
  ));

-- ✅ 推奨パターン（配列を使用）
CREATE POLICY "Check membership" ON posts
  USING (group_id IN (
    SELECT group_id FROM memberships 
    WHERE user_id = (select auth.uid())
  ));
```

#### 5. ロールの明示
`TO`演算子で対象ロールを明示的に指定する。

```sql
CREATE POLICY "Enable access" ON table
  FOR ALL 
  TO authenticated  -- ロールを明示
  USING (user_id = (select auth.uid()));
```

### SECURITY DEFINER関数の使用（複雑なロジックの場合のみ）
複雑なビジネスロジックをカプセル化し、RLSをバイパスしてパフォーマンスを向上させる場合に使用。

```sql
CREATE FUNCTION get_user_data(p_user_id uuid)
RETURNS TABLE (...) 
SECURITY DEFINER
SET search_path = public
AS $$
  -- 複雑なロジック
$$;
```

### 実装チェックリスト
- [ ] RLSポリシーで使用するカラムにインデックスが存在するか
- [ ] auth.uid()を(select auth.uid())でラップしているか
- [ ] クエリで明示的なフィルタを追加しているか
- [ ] JOINの代わりにIN/ANY演算子を使用しているか
- [ ] ポリシーでTO句を使用してロールを明示しているか
- [ ] EXPLAIN ANALYZEでクエリプランを確認したか

### パフォーマンステスト
```sql
-- RLSポリシーのパフォーマンスを確認
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM your_table 
WHERE user_id = (select auth.uid())
LIMIT 10;
```

### 参考リンク
- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
- [RLS Best Practices Discussion](https://github.com/orgs/supabase/discussions/14576)

### 避けるべきこと
- **`any`型の使用は厳禁** - 必ず適切な型を指定すること
- コメントなしの複雑なロジック
- 直接的なDOM操作
- グローバル変数の使用
- セキュリティキーのハードコーディング
- 認証確認なしのサーバーアクション実装
- parseではなくsafeParseを使用しない実装

### 推奨事項
- コンポーネントの単一責任原則
- 再利用可能なユーティリティ関数の作成
- 適切なローディング状態の実装
- アクセシビリティの考慮
- 型定義は`lib/types`に配置
- スキーマは`lib/schemas`に配置

## 今後の実装予定

1. Supabaseの初期設定
2. 認証フローの実装
3. 基本的なCRUD操作
4. 検索機能の実装
5. ダッシュボードの構築

## 参考リンク

- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Design](https://vercel.com/design)