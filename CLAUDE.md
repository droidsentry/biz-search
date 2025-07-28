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

サーバーコンポーネントとクライアントコンポーネントの使い分けについては以下を参照：
- [コンポーネント設計パターン](./docs/main/component-patterns.md)

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

React Hook FormとZodを使用したフォーム実装の詳細は以下を参照：
- [フォーム実装ガイド](./docs/main/form-implementation.md)

### 4. サーバーアクションパターン

Next.js サーバーアクションの実装パターンについては以下を参照：
- [サーバーアクション実装ガイド](./docs/main/server-actions.md)

### 5. ルートハンドラーパターン

Next.js API Routes（ルートハンドラー）の実装パターンについては以下を参照：
- [ルートハンドラー実装ガイド](./docs/main/route-handlers.md)

### 6. データフェッチングとキャッシュ

SWRを使用したデータフェッチングパターンについては以下を参照：
- [データフェッチングガイド](./docs/main/data-fetching.md)

### 7. Supabase使用パターン

Supabaseクライアントの作成とクエリパターンについては以下を参照：
- [Supabase実装パターン](./docs/main/supabase-patterns.md)

## 型定義のベストプラクティス

Supabaseデータベース型の使用方法と型定義のベストプラクティスについては以下を参照：
- [データベース型定義ガイド](./docs/db/database-types.md)

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

Supabase公式推奨のRLSパフォーマンス最適化とベストプラクティスについては以下を参照：
- [RLSベストプラクティスガイド](./docs/db/rls-best-practices.md)

### 型安全性の厳格な遵守

#### 絶対に使用禁止
- **`any`型** - 必ず適切な型を指定すること
- **`unknown`型** - 型ガードやアサーションで具体的な型に変換すること
- **型アサーション（as）の乱用** - 本当に必要な場合のみ使用

#### 必須の型安全実践
1. **型推論の活用**
   ```typescript
   // ❌ 悪い例
   const data: any = await fetchData()
   const result: unknown = processData(data)
   
   // ✅ 良い例
   const data = await fetchData() // 戻り値の型から推論
   const result = processData(data) // 引数と戻り値の型から推論
   ```

2. **型生成の活用**
   ```typescript
   // Supabaseの型生成
   import { Tables } from '@/lib/types/database'
   
   // Zodスキーマからの型生成
   import { z } from 'zod'
   const schema = z.object({ name: z.string() })
   type SchemaType = z.infer<typeof schema>
   ```

3. **ジェネリクスの適切な使用**
   ```typescript
   // 汎用的な関数にはジェネリクスを使用
   function processArray<T>(items: T[]): T[] {
     return items.filter(Boolean)
   }
   ```

4. **厳格なnullチェック**
   ```typescript
   // オプショナルチェイニングとnullish coalescing
   const name = user?.profile?.name ?? 'デフォルト名'
   ```

### その他の避けるべきこと
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

## Supabaseクライアント使用方針

### JavaScriptクライアントライブラリ
- **必須**: すべてのDB通信には`@supabase/supabase-js`を使用
- **ドキュメント参照**: 実装時は必ずMCP経由でSupabase公式ドキュメントを参照
- **実装パターン**: [Supabase実装パターン](./docs/main/supabase-patterns.md)を参照

### トランザクション処理
- **RPC使用**: 複雑なトランザクションが必要な場合はリモートプロシージャコールを使用

### 実装前の必須手順
1. MCPでSupabaseドキュメントから該当機能のベストプラクティスを検索
2. 最新のAPIとメソッドを確認
3. エラーハンドリングパターンを確認

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