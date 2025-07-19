# ユーザー招待ガイド

このドキュメントでは、Biz Searchアプリケーションでユーザーを招待し、適切な権限を割り当てる方法を説明します。

## 概要

ユーザー招待システムは、メール認証を通じて新規ユーザーを登録し、適切なロール（system_owner または user）を割り当てる機能を提供します。

## ロールの種類

### 1. system_owner
- システム全体の管理者権限
- 全プロジェクトへのアクセス権限
- 全ユーザープロファイルの閲覧権限
- システム統計の閲覧権限

### 2. user（デフォルト）
- 通常のユーザー権限
- project_membersテーブルに基づくプロジェクトアクセス
- 自分のプロファイルのみ閲覧可能

## 招待方法

### 基本的な招待（通常ユーザー）

```typescript
// Supabase Admin APIを使用した招待
const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
  'user@example.com',
  {
    redirectTo: 'https://yourdomain.com/password-update',
  }
)
```

### system_owner権限での招待

system_owner権限を持つユーザーを招待する場合は、招待URLにroleパラメータを追加します：

```typescript
// system_owner権限での招待
const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
  'admin@example.com',
  {
    redirectTo: 'https://yourdomain.com/password-update',
    data: {
      // カスタムメタデータとして追加
    }
  }
)

// 招待メールのリンクをカスタマイズ
// メール内のリンクに ?role=system_owner を追加
// 例: https://yourdomain.com/api/auth/confirm?token_hash=xxx&type=email&next=/&role=system_owner
```

## 実装の流れ

1. **招待メール送信**
   - 管理者が新規ユーザーのメールアドレスを指定
   - roleパラメータを含む招待URLを生成

2. **メール認証** (`/api/auth/confirm`)
   - ユーザーがメールのリンクをクリック
   - URLからroleパラメータを取得
   - user_metadataにpending_roleとして保存

3. **パスワード設定** (`/password-update`)
   - ユーザーがパスワードとユーザー名を設定
   - profilesテーブルにレコード作成
   - pending_roleから実際のroleを設定

4. **完了**
   - pending_roleをクリア
   - ユーザーは割り当てられた権限でシステムを利用開始

## セキュリティ考慮事項

1. **招待URLの管理**
   - 招待URLは安全に管理し、不正アクセスを防ぐ
   - 有効期限を設定することを推奨

2. **system_owner権限の付与**
   - system_owner権限は慎重に付与する
   - 必要最小限のユーザーのみに限定

3. **RLSによる保護**
   - profilesテーブルのroleカラムは、ユーザー自身では変更不可
   - RLSポリシーにより適切に保護されている

## トラブルシューティング

### Q: 招待メールが届かない
A: 
- Supabaseのメール設定を確認
- スパムフォルダを確認
- カスタムSMTPの設定を検討

### Q: roleが正しく設定されない
A: 
- 招待URLにroleパラメータが含まれているか確認
- user_metadataにpending_roleが保存されているか確認
- profilesテーブルの作成時にエラーがないか確認

### Q: 既存ユーザーのroleを変更したい
A: 
- 直接データベースで更新（管理者権限が必要）
```sql
UPDATE profiles 
SET role = 'system_owner' 
WHERE email = 'user@example.com';
```

## 関連ファイル

- `/app/api/auth/confirm/route.ts` - メール認証処理
- `/lib/actions/auth/supabase.ts` - パスワード更新とprofile作成
- `/docs/db/002_create_rls_policies.sql` - RLSポリシー定義