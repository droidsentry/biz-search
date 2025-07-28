# ルートハンドラー実装パターン

## 基本的なGETハンドラー

```tsx
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    )
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('製品取得エラー:', error)
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 }
    )
  }
}
```

## POSTハンドラー（データ作成）

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
      .insert({
        ...result.data,
        user_id: user.id,
      })
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

## 動的ルートハンドラー

```tsx
// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    )
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '製品が見つかりません' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('製品取得エラー:', error)
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 }
    )
  }
}
```

## 重要なポイント

1. **必ず認証確認を行う**
2. **適切なHTTPステータスコードを返す**
3. **エラーハンドリングを適切に行う**
4. **RLSを考慮したクエリフィルタを追加**