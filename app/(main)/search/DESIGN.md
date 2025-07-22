# 検索システム設計書

## 1. システム概要

### 目的

ビジネス情報検索システムにおいて、Google Custom Search APIを活用した高度な検索機能を提供する。Claudeのプロジェクト管理画面のようなUIを採用し、検索パターンの保存・再利用を可能にすることで、効率的な情報収集を実現する。

### 主要機能

- 検索パターンの作成・保存・管理
- 高度な検索条件の設定（追加キーワード、サイト指定、検索期間など）
- 検索結果の表示とページネーション
- よく使う検索パターンの素早い実行
- API使用状況の追跡と監視

### ClaudeChat風UIの採用理由

- 直感的で使いやすいインターフェース
- 検索パターンのカード表示による視認性の向上
- サイドバーでの素早い検索実行
- 作業効率を最大化するレイアウト

## 2. ページ構成

### 2.1 `/search` - 検索パターン一覧画面

**目的**: 保存された検索パターンを管理し、素早くアクセスできるようにする

**主要機能**:

- 検索パターンのグリッド表示（カード形式）
- パターンの検索・フィルタリング
- 使用頻度順・更新日時順でのソート
- 新規パターン作成へのナビゲーション

**レイアウト**:

```md
┌─────────────────────────────────────────┐
│ ヘッダー                                │
│ ├─ タイトル「カスタム検索」             │
│ └─ 新規検索パターンボタン               │
├─────────────────────────────────────────┤
│ 検索・フィルターバー                    │
├─────────────────────────────────────────┤
│ パターンカードグリッド                  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ カード1  │ │ カード2  │ │ カード3  │ │
│ └─────────┘ └─────────┘ └─────────┘ │
└─────────────────────────────────────────┘
```

### 2.2 `/search/create` - 新規検索パターン作成

**目的**: 新しい検索パターンを作成し、初期設定を行う

**主要機能**:

- パターン名と説明の入力
- 基本的な検索条件の設定
- 作成後は検索実行画面へ自動遷移

**フロー**:

1. パターン名と説明を入力
2. 基本的な検索条件を設定（任意）
3. 「作成」ボタンで保存
4. `/search/[searchId]`へリダイレクト

### 2.3 `/search/[searchId]` - 検索実行画面

**目的**: 検索の実行と結果表示、検索条件の調整を効率的に行う

**レイアウト**:

```md
┌─────────────────────────────────────────────────┐
│ ヘッダー（パターン名、編集・削除ボタン）        │
├───────────────────────┬─────────────────────────┤
│                       │ ScrollArea（スクロール可）│
│                       │ ┌─────────────────────┐ │
│   検索結果一覧        │ │ 検索フォーム        │ │
│   （メイン領域）      │ │ （コンパクト版）    │ │
│                       │ └─────────────────────┘ │
│                       │ ┌─────────────────────┐ │
│                       │ │ 保存パターン一覧    │ │
│                       │ │ ┌─────────────────┐ │ │
│                       │ │ │ パターンカード1  │ │ │
│                       │ │ └─────────────────┘ │ │
│                       │ │ ┌─────────────────┐ │ │
│                       │ │ │ パターンカード2  │ │ │
│                       │ │ └─────────────────┘ │ │
│                       │ └─────────────────────┘ │
└───────────────────────┴─────────────────────────┘
```

**主要機能**:

- 左側: 検索結果の表示（既存の`search-results.tsx`を改良）
- 右側: ScrollAreaでラップされたサイドバー
  - 上部: コンパクトな検索フォーム（Card内）
  - 下部: 保存済みパターンのクイックアクセス

## 3. コンポーネント設計

### 3.1 ディレクトリ構造

```md
app/(main)/search/
├── page.tsx                        # パターン一覧画面
├── create/
│   └── page.tsx                   # 新規作成画面
├── [searchId]/
│   ├── page.tsx                   # 検索実行画面
│   ├── layout.tsx                 # プロバイダー設定
│   └── components/
│       ├── search-layout.tsx      # 全体レイアウト管理
│       ├── search-results.tsx     # 検索結果表示（改良版）
│       ├── search-sidebar.tsx     # 右サイドバー全体（ScrollArea含む）
│       ├── compact-search-form.tsx # コンパクト検索フォーム
│       ├── pattern-cards.tsx      # 保存パターンカード一覧
│       └── modals/
│           ├── pattern-edit-modal.tsx
│           └── pattern-delete-modal.tsx
└── components/
    ├── pattern-card.tsx           # パターンカード（共通）
    ├── pattern-grid.tsx           # パターングリッド（一覧用）
    └── empty-state.tsx            # 空状態の表示
```

### 3.2 主要コンポーネントの責務

#### PatternCard

- 検索パターンの情報表示
- クリックで検索実行
- 使用回数、最終使用日時の表示

#### CompactSearchForm

- 最小限のフィールド表示
- 顧客名、住所、検索期間を常時表示
- 詳細オプション（追加キーワード、サイト指定）は折りたたみ式

#### SearchResults

- 検索結果のリスト表示
- ページネーション機能
- エラーハンドリング
- ローディング状態

#### PatternCards

- サイドバーでのパターン一覧表示
- クリックで即座に検索実行
- 現在の顧客名・住所は維持

#### SearchSidebar

- ScrollAreaでラップされた右サイドバー
- 固定幅（w-72 lg:w-80）
- 検索フォームとパターン一覧を含む
- スクロール可能で長いコンテンツにも対応

### 3.3 データフロー

```typescript
// Context構造
SearchProvider
├── SearchPatternContext    // パターンの管理
│   ├── patterns[]         // 保存パターン一覧
│   ├── currentPattern     // 現在のパターン
│   └── actions           // CRUD操作
├── SearchFormContext      // フォーム状態
│   ├── formData          // 現在の入力値
│   └── updateField       // フィールド更新
└── SearchResultContext    // 検索結果
    ├── results           // 検索結果データ
    ├── loading          // ローディング状態
    └── error            // エラー状態
```

## 4. UI/UX仕様

### 4.1 デザインシステム

- **ベース**: Vercel風のミニマルデザイン
- **カラー**: モノクロームベース（黒・白・グレー）
- **タイポグラフィ**: Geist Sans/Mono
- **スペーシング**: Tailwindのデフォルトスケール
- **コンポーネント**: shadcn/ui

### 4.2 レスポンシブ対応

```md
- モバイル (< 768px): サイドバー非表示、検索フォームは別画面
- タブレット (768px - 1024px): サイドバー表示、2カラムレイアウト
- デスクトップ (> 1024px): フル3カラムレイアウト
```

### 4.3 インタラクション設計

#### パターンカードのクリック

1. カードをクリック
2. 現在の顧客名・住所は維持
3. その他の検索条件をパターンから適用
4. 自動的に検索実行
5. 結果を左側に表示

#### 検索フォームの操作

1. 顧客名入力（必須）
2. 住所入力（任意）
3. 検索期間選択（任意 - デフォルト：すべての期間）
4. 高度なオプション展開（任意）
   - 追加キーワード（OR検索）
   - サイト指定
5. 検索ボタンクリック
6. 結果表示とフォームのコンパクト化

### 4.4 サイドバーの実装詳細

```tsx
<ScrollArea className="h-full">
  {/* 検索フォーム */}
  <Card className="p-4 mb-4">
    <CompactSearchForm />
  </Card>
  
  {/* 保存パターン一覧 */}
  <div className="space-y-2">
    <h3 className="text-sm font-semibold px-4">保存済みパターン</h3>
    <PatternCards />
  </div>
</ScrollArea>
```

### 4.5 パフォーマンス最適化

- 検索結果の仮想スクロール（大量結果対応）
- パターンカードの遅延読み込み
- 検索のデバウンス処理
- 結果のキャッシング

## 5. 実装優先順位

### Phase 1: 基盤構築

1. データベーススキーマの実装
2. 基本的なページ構造の作成
3. Context/Providerの設計

### Phase 2: コア機能

1. 検索パターン一覧画面
2. 検索実行画面のレイアウト
3. コンパクト検索フォーム

### Phase 3: 機能拡張

1. パターンのCRUD操作
2. 検索履歴の記録
3. API使用状況の可視化

### Phase 4: 最適化

1. パフォーマンス改善
2. UIの微調整
3. エラーハンドリングの強化

## 6. 検索フォームの仕様

### 6.1 簡素化された検索フィールド

#### 基本フィールド

- **顧客名**（必須）
  - 完全一致/部分一致の選択可能
- **住所**（任意）
  - 都道府県の個別選択は廃止、一つのテキストフィールドに統合
  - 完全一致/部分一致の選択可能
- **検索期間**（任意）
  - デフォルト：すべての期間
  - 選択肢：過去1年、3年、5年、10年

#### 高度な検索オプション（折りたたみ式）

- **追加キーワード**
  - OR検索のみ（AND/OR選択は廃止）
  - タグ形式で複数入力可能
- **検索対象サイト**
  - すべてのサイト/指定サイトのみ/指定サイトを除外

#### 廃止された機能

- 都道府県の個別選択フィールド
- 追加キーワードのAND/OR選択
- 除外キーワード機能全体

### 6.2 検索期間の実装

Google Custom Search APIの`dateRestrict`パラメータを使用：

- `''`（空文字）: すべての期間
- `'y1'`: 過去1年間
- `'y3'`: 過去3年間
- `'y5'`: 過去5年間
- `'y10'`: 過去10年間

## 7. 技術的考慮事項

### セキュリティ

- RLSによるユーザーデータの保護
- APIキーの適切な管理
- XSS対策（検索結果のサニタイズ）

### パフォーマンス

- 検索結果のページング（10件/ページ）
- インデックスの適切な設定
- 不要な再レンダリングの防止

### 保守性

- コンポーネントの単一責任原則
- 型定義の徹底
- テスタブルな設計

## 8. Zodスキーマの更新

### 8.1 更新後のgoogleCustomSearchParamsSchema

DB設計に合わせて、以下のフィールドを更新：

```typescript
// lib/schemas/custom-search.ts
export const googleCustomSearchParamsSchema = z.object({
  customerName: nameSchema,
  customerNameExactMatch: matchTypeSchema,
  address: z.string().trim().optional(),
  addressExactMatch: matchTypeSchema,
  dateRestrict: z.enum(["", "y1", "y3", "y5", "y10"]).optional().default(""),
  isAdvancedSearchEnabled: z.boolean(),
  additionalKeywords: z.array(keywordsSchema),
  searchSites: z.array(z.string()),
  siteSearchMode: z.enum(['any', 'specific', 'exclude']),
});
```

### 8.2 削除されたフィールド

以下のフィールドは簡素化のため削除：

- `prefecture` - 住所フィールドに統合
- `prefectureExactMatch` - 住所フィールドに統合
- `additionalKeywordsSearchMode` - 常にOR検索で固定
- `excludeKeywords` - 除外キーワード機能全体を廃止

## 9. 検索機能の再利用設計

### 9.1 設計方針

検索フォームコンポーネントは、以下の場面で再利用可能な設計とする：

1. **検索専用画面**（`/search/[searchId]`）
   - フル機能の検索フォーム
   - パターン保存・管理機能
   - サイドバーでのパターン一覧

2. **顧客詳細画面**（`/projects/[projectId]/[ownerId]`）
   - 動的UIによる検索サイドバー
   - トグルボタンで検索パネルの表示/非表示
   - 顧客名・住所を自動入力
   - パターン一覧によるクイック検索
   - 検索結果の表示（展開時）

### 9.2 共通コンポーネントの配置

```
components/
├── search/                          # 検索関連の共通コンポーネント
│   ├── search-form.tsx             # 検索フォーム（再利用可能）
│   ├── search-results.tsx          # 検索結果表示
│   ├── compact-search-form.tsx     # コンパクト版フォーム
│   ├── search-form-fields.tsx      # フォームフィールドのみ
│   └── hooks/
│       ├── use-search.ts           # 検索ロジック
│       └── use-search-params.ts    # パラメータ管理
└── ui/                             # shadcn/ui

app/(main)/
├── search/                         # 検索専用画面
│   ├── page.tsx                   # パターン一覧
│   └── [searchId]/
│       └── page.tsx               # パターン実行画面
└── projects/
    └── [projectId]/
        └── [ownerId]/
            └── page.tsx           # 顧客詳細画面（検索機能付き）
```

### 9.3 検索フォームのインターフェース設計

```typescript
// components/search/search-form.tsx
interface SearchFormProps {
  mode?: 'standalone' | 'embedded';  // 単独/組み込みモード
  defaultValues?: Partial<GoogleCustomSearchParams>;
  onSearch?: (params: GoogleCustomSearchParams) => void;
  showPatternActions?: boolean;  // パターン保存ボタンの表示
  projectId?: string;
  className?: string;
}

export function SearchForm({
  mode = 'standalone',
  defaultValues,
  onSearch,
  showPatternActions = true,
  projectId,
  className
}: SearchFormProps) {
  // 共通の検索ロジック
  const { search, isLoading } = useSearch();
  
  // モードに応じたUIの切り替え
  if (mode === 'embedded') {
    return <CompactSearchForm {...props} />;
  }
  
  return <FullSearchForm {...props} />;
}
```

### 9.4 顧客詳細画面での動的UI実装

#### 9.4.1 レイアウト設計（Reactの状態管理とcn関数を活用）

```typescript
// app/(main)/projects/[projectId]/[ownerId]/page.tsx
import { cn } from "@/lib/utils";

export default function OwnerDetailPage({
  params: { projectId, ownerId }
}) {
  const [owner, setOwner] = useState<Tables<'owners'>>();
  const [searchResults, setSearchResults] = useState<GoogleSearchResult[]>();
  const [isSearching, setIsSearching] = useState(false);
  
  // 検索実行時のハンドラ
  const handleSearch = async (params: GoogleCustomSearchParams) => {
    setIsSearching(true);
    const results = await searchAPI(params);
    setSearchResults(results);
  };
  
  // 検索結果があるかどうか
  const hasSearchResults = searchResults && searchResults.length > 0;
  const showSearchMode = isSearching || hasSearchResults;
  
  return (
    <div className="h-screen overflow-hidden">
      {/* 顧客詳細ビュー */}
      <div className={cn(
        "h-full transition-all duration-300",
        showSearchMode && "hidden"
      )}>
        <ScrollArea className="h-full p-6">
          <OwnerInfo owner={owner} />
          
          {/* 検索フォーム（初期状態） */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>関連情報を検索</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchForm
                defaultValues={{
                  customerName: owner?.name,
                  address: owner?.address
                }}
                onSearch={handleSearch}
                projectId={projectId}
              />
            </CardContent>
          </Card>
        </ScrollArea>
      </div>
      
      {/* 検索結果ビュー */}
      <div className={cn(
        "h-full flex transition-all duration-300",
        !showSearchMode && "hidden"
      )}>
        {/* 検索結果（メインエリア） */}
        <div className="flex-1 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                検索結果 {hasSearchResults && `(${searchResults.length}件)`}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSearching(false);
                  setSearchResults(undefined);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                顧客詳細に戻る
              </Button>
            </div>
            
            {isSearching && !searchResults ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : hasSearchResults ? (
              <SearchResults results={searchResults} />
            ) : (
              <div className="text-center text-muted-foreground py-12">
                検索結果がありません
              </div>
            )}
          </div>
        </div>
        
        {/* 検索フォーム（サイドバー） */}
        <div className={cn(
          "border-l bg-background transition-all duration-300",
          "w-0 overflow-hidden",
          showSearchMode && "w-[400px]"
        )}>
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">検索条件</CardTitle>
                </CardHeader>
                <CardContent>
                  <CompactSearchForm
                    defaultValues={{
                      customerName: owner?.name,
                      address: owner?.address
                    }}
                    onSearch={handleSearch}
                    projectId={projectId}
                  />
                </CardContent>
              </Card>
              
              {/* 保存パターン一覧 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  保存済みパターン
                </h3>
                <PatternCards
                  projectId={projectId}
                  onPatternSelect={async (pattern) => {
                    const params = {
                      ...pattern.google_custom_search_params,
                      customerName: owner?.name || pattern.google_custom_search_params.customerName,
                      address: owner?.address || pattern.google_custom_search_params.address
                    };
                    await handleSearch(params);
                  }}
                  compact
                />
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
```

#### 9.4.2 状態管理のポイント

```typescript
// 状態の定義
const [searchResults, setSearchResults] = useState<GoogleSearchResult[]>();
const [isSearching, setIsSearching] = useState(false);

// 表示モードの判定
const hasSearchResults = searchResults && searchResults.length > 0;
const showSearchMode = isSearching || hasSearchResults;

// cn関数を使った条件付きクラス
<div className={cn(
  "base-classes",
  showSearchMode && "search-mode-classes",
  !showSearchMode && "normal-mode-classes"
)}>
```

#### 9.4.3 実装の利点

- **Reactの状態管理**: `useState`で検索状態を管理
- **cn関数の活用**: 条件付きクラスをクリーンに記述
- **論理的な表示制御**: 検索中または結果がある時に検索モード表示
- **スムーズな遷移**: `transition-all duration-300`でアニメーション
- **サイドバーの展開**: `w-0`から`w-[400px]`への遷移でスライド効果

### 9.5 共通化する機能

- 検索フォームのバリデーション（Zodスキーマ）
- Google Custom Search APIの呼び出し
- 検索結果の表示ロジック
- エラーハンドリング
- ローディング状態管理
- APIログの記録

### 9.6 画面固有の機能

#### 検索専用画面（/search）
- 検索パターンの管理（CRUD）
- 使用履歴の記録と表示
- パターンの一覧表示
- パターンの即時実行
- 使用頻度によるソート

#### 顧客詳細画面（/projects/[projectId]/[ownerId]）
- 顧客情報の自動入力
- 動的UIによる検索パネルの展開/収納
- 保存パターンからのクイック検索
- 検索結果の2段階表示（サイドバー→結果エリア）
- 検索結果から関連会社の抽出
- 検索結果の保存（将来実装）
- 顧客との関連付け（将来実装）

### 9.7 状態管理の方針

```typescript
// 検索状態の管理（共通hook）
export function useSearch() {
  const [results, setResults] = useState<GoogleSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const search = useCallback(async (params: GoogleCustomSearchParams) => {
    // API呼び出しロジック
  }, []);
  
  return { results, isLoading, error, search };
}

// 検索パラメータの管理（共通hook）
export function useSearchParams(defaultValues?: Partial<GoogleCustomSearchParams>) {
  const form = useForm<GoogleCustomSearchParams>({
    resolver: zodResolver(googleCustomSearchParamsSchema),
    defaultValues: {
      dateRestrict: "",
      isAdvancedSearchEnabled: false,
      additionalKeywords: [],
      searchSites: [],
      siteSearchMode: "any",
      ...defaultValues
    }
  });
  
  return form;
}
```

### 9.8 APIログの記録

両画面とも同じ`search_api_logs`テーブルに記録：

- **pattern_id**: 検索専用画面では設定、顧客詳細画面ではnull
- **project_id**: 両画面とも必須
- **search_query**: 実行したクエリを記録
- **google_custom_search_params**: 使用したパラメータをJSONBで保存

## 10. プロジェクトベースのアクセス制御

### 10.1 権限管理

- 検索パターンはプロジェクトに紐付く
- ユーザーはプロジェクトメンバーのパターンのみ閲覧可能
- system_ownerは全プロジェクトのパターンとAPI使用状況を閲覧可能

### 10.2 API使用状況の表示

system_ownerのみがアクセス可能な管理画面で以下を表示：

- プロジェクト別の月次使用状況
- 全体の使用傾向
- エラー率の監視
- レスポンスタイムの分析

## 11. 実装時の重要な注意事項

### 11.1 既存コードの修正が必要な箇所

実装開始前に、以下のファイルを新しい仕様に合わせて修正する必要があります：

#### 1. **Zodスキーマの更新** (`lib/schemas/custom-search.ts`)
- `prefecture`と`prefectureExactMatch`フィールドを削除
- `additionalKeywordsSearchMode`フィールドを削除（常にOR検索）
- `excludeKeywords`フィールドを削除
- `dateRestrict`フィールドを追加（enum: ["", "y1", "y3", "y5", "y10"]）

#### 2. **ユーティリティ関数の更新** (`lib/actions/google/utils.ts`)
- `generateGoogleCustomSearchParams`関数から都道府県関連の処理を削除
- `additionalKeywordsSearchMode`の条件分岐を削除（常にOR検索）
- `excludeKeywords`の処理を削除
- `dateRestrict`パラメータの処理を追加

#### 3. **SWRフックの活用** (`lib/swr/google-custom-search.ts`)
- 既存の`useGoogleCustomSearch`フックをそのまま活用
- 新しい画面でのキャッシュ期間は用途に応じて調整
- 検索専用画面: 3時間（デフォルト）
- 顧客詳細画面: 5分（頻繁な更新を想定）

#### 4. **型定義の更新** (`lib/types/custom-search.ts`)
- `GoogleSearchRequestParams`に`dateRestrict`を追加
- `GoogleCustomSearchParams`インターフェースを新しいスキーマに合わせて更新

### 11.2 実装の優先順位

1. まず上記のスキーマと型定義を更新
2. ユーティリティ関数を新仕様に対応
3. その後、UIコンポーネントの実装を開始

## 12. 動的UI実装の詳細仕様

### 12.1 顧客詳細画面での検索機能

#### 基本動作フロー

1. **初期状態（顧客詳細画面）**
   - 顧客情報が表示されている
   - 画面内に検索フォームがカードとして配置
   - 検索フォームには顧客名・住所が自動入力済み

2. **検索実行時**
   - 検索ボタンクリックで画面が切り替わる
   - 顧客詳細画面が非表示になり、検索結果画面が表示される
   - 検索フォームは右サイドバーに移動
   - メインエリアに検索結果が表示される

3. **検索モード中**
   - 右サイドバーから追加検索が可能
   - 保存パターンからクイック検索が可能
   - 「顧客詳細に戻る」ボタンで元の画面に戻る

#### 実装アプローチ

```typescript
// Reactの状態管理とcn関数を活用
const showSearchMode = isSearching || hasSearchResults;

// 顧客詳細ビュー
<div className={cn(
  "h-full transition-all duration-300",
  showSearchMode && "hidden"
)}>

// 検索結果ビュー
<div className={cn(
  "h-full flex transition-all duration-300",
  !showSearchMode && "hidden"
)}>

// サイドバーのスライドアニメーション
<div className={cn(
  "border-l bg-background transition-all duration-300",
  "w-0 overflow-hidden",
  showSearchMode && "w-[400px]"
)}>
```

#### レスポンシブ対応

- **デスクトップ（1024px以上）**: サイドバー固定幅400px
- **タブレット（768px-1024px）**: サイドバー幅を300pxに縮小
- **モバイル（768px未満）**: サイドバーを下部に配置（縦スクロール）

### 11.2 検索パターンの適用フロー

1. **パターンカードクリック**
   - 現在の顧客名・住所は維持
   - パターンの他の検索条件を適用
   - 即座に検索実行・結果更新

2. **検索フォームからの実行**
   - サイドバー内のフォームで条件変更
   - 検索ボタンで再検索
   - 結果はメインエリアに即座に反映

### 11.3 実装の簡潔性

- **Reactの状態管理**: `useState`で検索状態を管理
- **cn関数**: `@/lib/utils`の`cn`関数で条件付きクラスを適用
- **論理的な制御**: 検索中(`isSearching`)または結果あり(`hasSearchResults`)で表示切替
- **Tailwindアニメーション**: `transition-all duration-300`でスムーズな遷移
- **シンプルな構造**: 複雑なCSSやJSアニメーションは不使用
