import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import Image from "next/image";
import logo from "@/public/logo.png";

export const metadata: Metadata = {
  title: "BizSearch - ビジネス情報検索システム",
  description:
    "効率的なビジネス情報検索を実現。複数の条件を組み合わせて必要な情報をすばやく見つけることができます。",
};

export default function Home() {
  return (
    <div className="relative h-dvh overflow-hidden flex items-center justify-center">
      {/* 背景のグラデーション効果 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5" />

      {/* 装飾的な円形グラデーション */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full filter blur-3xl animate-pulse" />
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-primary/10 rounded-full filter blur-3xl animate-pulse animation-delay-2000" />

      {/* メインコンテンツ */}
      <div className="relative z-10 text-center space-y-12 px-4 max-w-2xl mx-auto">
        {/* ロゴ */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center">
          <Image
            src={logo}
            alt="BizSearch"
            width={80}
            height={80}
            className="drop-shadow-lg"
          />
        </div>

        {/* タイトル */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              BizSearch
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground font-light">
            ビジネス情報検索システム
          </p>
        </div>

        {/* CTAボタン */}
        <div className="pt-8">
          <Button
            size="lg"
            className="min-w-[200px] shadow-lg hover:shadow-xl transition-all duration-200"
            asChild
          >
            <Link href="/dashboard">検索を開始</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
