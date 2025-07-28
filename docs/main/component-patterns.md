# コンポーネント設計パターン

## サーバーコンポーネント（デフォルト）

```tsx
// ProductList.tsx
export default async function ProductList() {
  const products = await getProducts()
  return <ProductGrid products={products} />
}
```

## クライアントコンポーネント（必要時のみ）

```tsx
// InteractiveButton.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function InteractiveButton() {
  const [count, setCount] = useState(0)
  return <Button onClick={() => setCount(count + 1)}>Count: {count}</Button>
}
```

## 使い分けの指針

- **サーバーコンポーネント**: データフェッチング、静的コンテンツ
- **クライアントコンポーネント**: インタラクティブ要素、state管理、ブラウザAPI使用時