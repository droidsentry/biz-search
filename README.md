# Biz Search

ビジネス情報検索アプリケーション。Next.js、shadcn/ui、Supabaseを使用した高性能なWebアプリケーションです。

## 技術スタック

- **フレームワーク**: [Next.js 15.4.1](https://nextjs.org/) (App Router)
- **言語**: TypeScript 5
- **UI**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind CSS v4)
- **スタイリング**: Tailwind CSS v4 (Oxide Engine)
- **データベース**: [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security)
- **認証**: Supabase Auth
- **フォーム**: React Hook Form + Zod
- **状態管理**: SWR (キャッシュ管理)
- **ホスティング**: [Vercel](https://vercel.com/)
- **パッケージマネージャー**: pnpm

## デザインコンセプト

Vercelのデザインシステムを踏襲し、モダンで洗練されたUIを提供します。

## セットアップ

### 前提条件

- Node.js 20.x 以上
- pnpm 8.x 以上
- Supabaseアカウント

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/your-username/biz-search.git
cd biz-search

# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env.local
# .env.localファイルを編集し、Supabaseの認証情報を設定
```

### 環境変数

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# その他の環境変数は必要に応じて追加
```

### 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで [http://localhost:3001](http://localhost:3001) を開きます。

## プロジェクト構造

```
biz-search/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ページ（ログイン、サインアップ等）
│   ├── (main)/dashboard   # ダッシュボード（認証済みユーザー用）
│   ├── (public)/          # 公開ページ
│   ├── api/               # API Routes
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # トップページ
├── components/            # Reactコンポーネント
│   ├── ui/               # shadcn/uiコンポーネント
│   ├── forms/            # フォームコンポーネント
│   └── layouts/          # レイアウトコンポーネント
├── hooks/                 # カスタムフック
├── lib/                   # ユーティリティ関数
│   ├── supabase/         # Supabaseクライアント設定
│   ├── schemas/          # Zodスキーマ定義
│   └── types/            # TypeScript型定義
└── public/               # 静的ファイル
```

## 開発ガイドライン

### コンポーネント開発

- **サーバーコンポーネント優先**: 可能な限りサーバーコンポーネントを使用
- **クライアントコンポーネント**: インタラクティブな機能が必要な場合のみ使用

### フォーム実装

```tsx
// 1. Zodスキーマの定義 (lib/schemas/auth.schema.ts)
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// 2. 型定義 (lib/types/auth.types.ts)
import { z } from 'zod'
import { loginSchema } from '@/lib/schemas/auth.schema'

export type LoginFormData = z.infer<typeof loginSchema>

// 3. React Hook Formとの統合
import { LoginFormData } from '@/lib/types/auth.types'
import { loginSchema } from '@/lib/schemas/auth.schema'

const form = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
})
```

### サーバーアクション実装

```tsx
// app/actions/auth.actions.ts
'use server'

import { loginSchema } from '@/lib/schemas/auth.schema'
import { createClient } from '@/lib/supabase/server'

export async function loginAction(formData: FormData) {
  // 1. 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: '認証が必要です' }
  }

  // 2. データ検証（safeParse使用）
  const result = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return { error: result.error.flatten() }
  }

  // 3. 処理実行
  const { data, error } = await supabase.auth.signInWithPassword(result.data)
  
  if (error) {
    return { error: error.message }
  }

  return { success: true, data }
}
```

### データフェッチング

```tsx
// SWRを使用したキャッシュ管理
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

function useUser(id: string) {
  const { data, error, isLoading } = useSWR(`/api/user/${id}`, fetcher)
  return { user: data, error, isLoading }
}
```

## Supabase設定

### Row Level Security (RLS)

パフォーマンスを考慮したRLSポリシーの設定：

```sql
-- 効率的なポリシー例
CREATE POLICY "Users can view own data" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- インデックスの追加
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
```

参考：
- [RLS Performance Recommendations](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
- [RLS Best Practices](https://github.com/orgs/supabase/discussions/14576)

## ビルドとデプロイ

### ローカルビルド

```bash
pnpm build
pnpm start
```

### Vercelへのデプロイ

1. [Vercel](https://vercel.com)でプロジェクトをインポート
2. 環境変数を設定
3. デプロイ

## スクリプト

```bash
pnpm dev        # 開発サーバー起動（ポート3001、Turbopack使用）
pnpm build      # プロダクションビルド
pnpm start      # プロダクションサーバー起動
pnpm lint       # ESLintによるコード検証
```

## ライセンス

MIT