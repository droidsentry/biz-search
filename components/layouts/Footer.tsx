import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-[1400px] px-2 md:px-4 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* 会社情報 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">BizSearch</h3>
            <p className="text-sm text-muted-foreground">
              ビジネス情報検索プラットフォーム
            </p>
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 75 65" height="16" fill="currentColor" className="text-muted-foreground">
                <path d="M37.59.25l36.95 64H.64l36.95-64z" />
              </svg>
              <span className="text-xs text-muted-foreground">© 2024 BizSearch Inc.</span>
            </div>
          </div>

          {/* プロダクト */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">プロダクト</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
                  企業検索
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  分析ダッシュボード
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* サポート */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">サポート</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  ヘルプセンター
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  お問い合わせ
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  ステータス
                </Link>
              </li>
            </ul>
          </div>

          {/* 法的情報 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">法的情報</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  特定商取引法に基づく表記
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 下部の情報 */}
        <div className="mt-8 border-t border-border pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              BizSearch は、企業情報の検索と分析を支援するプラットフォームです。
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Twitter
              </Link>
              <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </Link>
              <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                LinkedIn
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}