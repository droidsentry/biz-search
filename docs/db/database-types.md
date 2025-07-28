# データベース型定義のベストプラクティス

## Supabaseデータベース型の使用

Supabaseから取得するデータの型は、`@/lib/types/database.ts`から提供される型ヘルパーを使用すること。

### 基本的な型定義

```typescript
import { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'

// Row型（データ取得時）
type Owner = Tables<'owners'>
type Property = Tables<'properties'>
type Project = Tables<'projects'>

// Insert型（データ挿入時）
type OwnerInsert = TablesInsert<'owners'>
type PropertyInsert = TablesInsert<'properties'>
type ProjectInsert = TablesInsert<'projects'>

// Update型（データ更新時）
type OwnerUpdate = TablesUpdate<'owners'>
type PropertyUpdate = TablesUpdate<'properties'>
type ProjectUpdate = TablesUpdate<'projects'>

// 配列型
type OwnerArray = Tables<'owners'>[]
type PropertyArray = Tables<'properties'>[]
type ProjectArray = Tables<'projects'>[]
```

### 実装例

```typescript
// ❌ 悪い例
let owners: any[] = [];
const result: any = await supabase.from('owners').select();

// ✅ 良い例
import { Tables } from '@/lib/types/database'

let owners: Tables<'owners'>[] = [];
const { data, error } = await supabase
  .from('owners')
  .select()
  .returns<Tables<'owners'>[]>();
```

### リレーション付きの型定義

```typescript
// 結合クエリの型定義
type ProjectWithOwners = Tables<'projects'> & {
  owners: Tables<'owners'>[]
}

// 使用例
const { data, error } = await supabase
  .from('projects')
  .select(`
    *,
    owners (*)
  `)
  .returns<ProjectWithOwners[]>();
```

### カスタム型の拡張

```typescript
// lib/types/custom.types.ts
import { Tables } from '@/lib/types/database'

// 基本型を拡張
export type ProjectWithStats = Tables<'projects'> & {
  totalOwners: number
  totalProperties: number
  lastActivity: Date
}

// Enumの定義
export type ProjectStatus = 'active' | 'completed' | 'archived'

// 複合型の定義
export type DashboardData = {
  projects: Tables<'projects'>[]
  recentActivities: Tables<'activities'>[]
  statistics: {
    totalProjects: number
    activeProjects: number
    totalOwners: number
  }
}
```

## 型定義の配置ルール

1. **データベーステーブルの型**: 直接`Tables<'テーブル名'>`を使用
2. **カスタム型定義**: `lib/types/`ディレクトリに配置
3. **Zodスキーマから生成される型**: `z.infer<typeof schema>`を使用

### ディレクトリ構造

```
lib/
└── types/
    ├── database.ts      # Supabaseが生成する型定義
    ├── custom.types.ts  # カスタム型定義
    ├── api.types.ts     # API関連の型定義
    └── ui.types.ts      # UI関連の型定義
```

## 型安全性の確保

### 1. 厳格な型チェック

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 2. 型ガードの使用

```typescript
// 型ガード関数
function isOwner(data: unknown): data is Tables<'owners'> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data
  )
}

// 使用例
const response = await fetch('/api/owners/1')
const data = await response.json()

if (isOwner(data)) {
  // dataはTables<'owners'>型として扱える
  console.log(data.name)
}
```

### 3. ジェネリクスの活用

```typescript
// 汎用的なAPIレスポンス型
type ApiResponse<T> = {
  data?: T
  error?: string
  success: boolean
}

// 使用例
async function fetchOwner(id: string): Promise<ApiResponse<Tables<'owners'>>> {
  try {
    const { data, error } = await supabase
      .from('owners')
      .select()
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    return { data, success: true }
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : '不明なエラー',
      success: false 
    }
  }
}
```

## 重要なポイント

1. **any型の使用は厳禁** - 必ず適切な型を指定
2. **型の自動生成を活用** - Supabaseの型生成機能を使用
3. **型の再利用** - 共通の型は別ファイルに定義
4. **型安全なデータ操作** - 型ガードやジェネリクスを活用