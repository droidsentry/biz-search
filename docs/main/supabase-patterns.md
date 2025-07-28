# Supabase実装パターン

## クライアントの作成

### ブラウザクライアント

```tsx
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### サーバークライアント

```tsx
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
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

## 基本的なクエリパターン

### データ取得

```typescript
// 基本的なクエリ
const { data, error } = await supabase
  .from('search_patterns')
  .select('*')
  .eq('project_id', projectId);

// RLSを考慮した明示的なフィルタ
const { data, error } = await supabase
  .from('search_patterns')
  .select('*')
  .eq('user_id', userId)
  .eq('project_id', projectId);

// 結合を含むクエリ
const { data, error } = await supabase
  .from('projects')
  .select(`
    *,
    owners (
      id,
      name,
      email
    )
  `)
  .eq('user_id', userId);
```

### データ挿入

```typescript
const { data, error } = await supabase
  .from('products')
  .insert({
    name: 'プロダクト名',
    description: '説明',
    user_id: userId,
  })
  .select()
  .single();
```

### データ更新

```typescript
const { data, error } = await supabase
  .from('products')
  .update({ name: '新しい名前' })
  .eq('id', productId)
  .eq('user_id', userId)
  .select()
  .single();
```

### データ削除

```typescript
const { error } = await supabase
  .from('products')
  .delete()
  .eq('id', productId)
  .eq('user_id', userId);
```

## トランザクション処理（RPC使用）

```typescript
// データベース関数の呼び出し
const { data, error } = await supabase.rpc('create_pattern_with_log', {
  pattern_name: 'パターン名',
  pattern_params: { /* ... */ },
  project_id: projectId
});

// 複雑な処理の例
const { data, error } = await supabase.rpc('bulk_update_owners', {
  owner_ids: [1, 2, 3],
  update_data: {
    status: 'active',
    updated_at: new Date().toISOString()
  }
});
```

## リアルタイム購読

```typescript
// lib/hooks/use-realtime.ts
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeProducts() {
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log('Change received!', payload)
          // ここでstateを更新
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}
```

## 重要なポイント

1. **型安全性を保つためDatabaseタイプを使用**
2. **RLSを考慮して明示的なフィルタを追加**
3. **エラーハンドリングを適切に実装**
4. **トランザクションが必要な場合はRPCを使用**