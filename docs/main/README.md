# メインアプリケーション実装ガイド

このディレクトリには、Biz Searchアプリケーションのフロントエンド実装に関するガイドラインとコード例が含まれています。

## ドキュメント一覧

### コンポーネント関連
- [component-patterns.md](./component-patterns.md) - サーバー/クライアントコンポーネントの使い分け

### フォーム実装
- [form-implementation.md](./form-implementation.md) - React Hook FormとZodを使用したフォーム実装

### API実装
- [server-actions.md](./server-actions.md) - Next.js サーバーアクション
- [route-handlers.md](./route-handlers.md) - API Routes（ルートハンドラー）

### データ管理
- [data-fetching.md](./data-fetching.md) - SWRを使用したデータフェッチング
- [supabase-patterns.md](./supabase-patterns.md) - Supabaseクライアントとクエリパターン

## 実装の流れ

1. **コンポーネント設計** - サーバー/クライアントコンポーネントの選択
2. **スキーマ定義** - Zodを使用したバリデーションスキーマ
3. **型定義** - TypeScriptの型安全性を確保
4. **実装** - 各パターンに従って実装
5. **エラーハンドリング** - 適切なエラー処理