# データフェッチングパターン

## SWRを使用したクライアントサイドフェッチング

```tsx
// lib/hooks/use-products.ts
import useSWR from 'swr'
import { Product } from '@/lib/types/product.types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR<Product[]>(
    '/api/products', 
    fetcher, 
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  return {
    products: data,
    isLoading,
    isError: !!error,
    mutate,
  }
}
```

## 個別データのフェッチング

```tsx
// lib/hooks/use-product.ts
import useSWR from 'swr'
import { Product } from '@/lib/types/product.types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useProduct(id: string) {
  const { data, error, isLoading } = useSWR<Product>(
    id ? `/api/products/${id}` : null,
    fetcher
  )

  return {
    product: data,
    isLoading,
    isError: !!error,
  }
}
```

## ミューテーション（データ更新）

```tsx
// components/ProductList.tsx
'use client'
import { useProducts } from '@/lib/hooks/use-products'
import { createProductAction } from '@/app/actions/product.actions'

export function ProductList() {
  const { products, isLoading, mutate } = useProducts()

  const handleCreate = async (formData: FormData) => {
    // オプティミスティック更新
    mutate(async (products) => {
      const result = await createProductAction(formData)
      
      if (result.success && result.data) {
        return [...(products || []), result.data]
      }
      
      return products
    }, {
      revalidate: true
    })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {products?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

## サーバーコンポーネントでのデータフェッチング

```tsx
// app/products/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('製品取得エラー:', error)
    return <div>エラーが発生しました</div>
  }

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

## キーポイント

1. **SWRのオプション設定で不要な再フェッチを防ぐ**
2. **オプティミスティック更新でUXを向上**
3. **エラーハンドリングを適切に実装**
4. **サーバーコンポーネントでの初期データフェッチング**