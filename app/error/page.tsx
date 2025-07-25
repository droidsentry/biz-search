import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full px-6 py-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              エラーが発生しました
            </h1>
            <p className="text-sm text-muted-foreground">
              申し訳ございません。予期せぬエラーが発生しました。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                ホームに戻る
              </Link>
            </Button>
          </div>

          <div className="pt-6 border-t">
            <p className="text-xs text-muted-foreground">
              問題が続く場合は、管理者にお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
