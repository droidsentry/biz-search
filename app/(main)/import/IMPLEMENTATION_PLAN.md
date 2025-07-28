# Import機能セキュリティ強化実装計画

## 概要
現在クライアントサイドで直接Supabaseを操作している処理を、API Route経由に変更してセキュリティを強化する。

## 現状の問題点
1. クライアントサイドから`import_staging`テーブルへの直接INSERT
2. セッションIDがクライアントで生成される
3. データ改ざんのリスク

## 実装手順

### Phase 1: API Routeの作成
- [ ] `/app/api/import/properties/route.ts`を新規作成
- [ ] POSTメソッドでプロパティデータを受け取る処理を実装
- [ ] 認証とシステム管理者権限チェックを実装
- [ ] サーバーサイドでのデータ検証を実装

### Phase 2: サーバーサイド処理の実装
- [ ] Supabase Server Clientを使用した認証確認
- [ ] `is_system_owner()`による権限確認
- [ ] サーバーサイドでのセッションID生成
- [ ] Supabase Admin SDKを使用したデータ投入
- [ ] エラーハンドリングの実装

### Phase 3: クライアントコンポーネントの修正
- [ ] `save-properties-dialog.tsx`の修正
- [ ] Supabaseクライアントの直接使用を削除
- [ ] API Routeへのfetch呼び出しに変更
- [ ] プログレス表示の調整

### Phase 4: 型定義とスキーマの整備
- [ ] API Request/Response型の定義
- [ ] Zodスキーマの作成
- [ ] エラーレスポンス型の定義

### Phase 5: テストと検証
- [ ] API Routeの動作確認
- [ ] エラーケースのテスト
- [ ] パフォーマンステスト
- [ ] セキュリティ監査

## 技術詳細

### API Route実装例
```typescript
// app/api/import/properties/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { importPropertiesSchema } from '@/lib/schemas/import'

export async function POST(request: NextRequest) {
  try {
    // 1. 認証確認
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    
    // 2. システム管理者確認
    const { data: isSystemOwner } = await supabase
      .rpc('is_system_owner')
    
    if (!isSystemOwner) {
      return NextResponse.json(
        { error: 'この操作はシステム管理者のみ実行可能です' },
        { status: 403 }
      )
    }
    
    // 3. リクエストボディの検証
    const body = await request.json()
    const validatedData = importPropertiesSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: '入力データが不正です', details: validatedData.error },
        { status: 400 }
      )
    }
    
    // 4. セッションID生成（サーバーサイド）
    const sessionId = crypto.randomUUID()
    
    // 5. Admin SDKでデータ投入
    const adminClient = createAdminClient()
    
    // ... 実装続き
  } catch (error) {
    // エラーハンドリング
  }
}
```

### クライアント修正例
```typescript
// save-properties-dialog.tsx の修正
const onSubmit = async (data: CreateProjectFormData) => {
  try {
    const response = await fetch('/api/import/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectName: data.name,
        projectDescription: data.description,
        properties: properties
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }
    
    const result = await response.json()
    // ... 成功処理
  } catch (error) {
    // エラー処理
  }
}
```

## 期待される効果
1. セキュリティの大幅な向上
2. データ検証の強化
3. エラーハンドリングの一元化
4. 将来的な拡張性の確保

## 注意事項
- 既存の機能を壊さないよう段階的に実装
- 十分なテストを実施
- エラーメッセージはユーザーフレンドリーに