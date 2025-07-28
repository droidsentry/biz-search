# データベース実装ガイド

このディレクトリには、Biz Searchアプリケーションのデータベース関連の実装ガイドラインが含まれています。

## ドキュメント一覧

### 型定義
- [database-types.md](./database-types.md) - Supabaseデータベース型の使用方法

### パフォーマンス最適化
- [rls-best-practices.md](./rls-best-practices.md) - Row Level Security (RLS) ベストプラクティス

### 既存ドキュメント

#### 現在のDB構造
- [old/](./old/) - 従来のデータベース実装ドキュメント
- [demo/](./demo/) - デモ環境用のマイグレーションスクリプト

#### 実装履歴
- [012_truncate_owners_properties.sql](./012_truncate_owners_properties.sql)
- [013_owner_based_progress_calculation.md](./013_owner_based_progress_calculation.md)
- [014_property_owner_dual_view_implementation.md](./014_property_owner_dual_view_implementation.md)
- [015_large_data_import_implementation.md](./015_large_data_import_implementation.md)

## 重要な原則

1. **型安全性** - 必ずSupabaseが生成する型定義を使用
2. **パフォーマンス** - RLSのベストプラクティスに従う
3. **セキュリティ** - 適切な認証とアクセス制御
4. **保守性** - わかりやすい命名規則とドキュメント化