import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import logo from "@/public/logo.png";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full px-6 py-8">
        <div className="text-center space-y-6">
          {/* ロゴ */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center">
            <Image
              src={logo}
              alt="BizSearch"
              width={64}
              height={64}
              className="drop-shadow-md opacity-50"
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
            <h2 className="text-2xl font-semibold tracking-tight">
              ページが見つかりません
            </h2>
            <p className="text-sm text-muted-foreground">
              お探しのページは存在しないか、
              <br />
              移動または削除された可能性があります。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default" className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                ホームに戻る
              </Link>
            </Button>

            <Button asChild variant="outline" className="gap-2">
              <Link href="/dashboard">
                <Search className="h-4 w-4" />
                検索を開始
              </Link>
            </Button>
          </div>

          <div className="pt-6 border-t">
            <p className="text-xs text-muted-foreground">
              URLが正しいかご確認ください。問題が続く場合は、
              <br />
              管理者にお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
