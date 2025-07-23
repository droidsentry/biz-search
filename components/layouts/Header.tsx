"use client";

import { useScrollRange } from "@/hooks/use-scroll-range";
import { cn } from "@/lib/utils";
import logo from "@/public/logo.png";
import Image from "next/image";
import Link from "next/link";
import AvatarMenu from "./avatar-menu";

export function Header() {
  const logoScale = useScrollRange(0, 50, 1, 0.8);
  const logoY = useScrollRange(0, 50, 0, -13); // スクロール時に8px上に移動

  return (
    <header
      className={cn(
        "flex h-16 min-h-[64px] items-center px-4 md:px-6 bg-muted",
        "[&_a]:ease-[ease]",
        "[&_a]:no-underline",
        "[&_a]:transition-colors",
        "[&_a]:duration-200"
      )}
    >
      {" "}
      {/* ロゴ（fixed position） */}
      <Link href="/" aria-label="BizSearch logo" className="relative">
        <span
          className={cn(
            "fixed left-[35px] top-[14px] z-[100] inline-flex size-10",
            "rounded-sm no-underline outline-offset-2 transition-transform duration-50 ease-linear origin-left"
          )}
          style={{
            transform: `scale(${logoScale}) translateY(${logoY}px)`,
          }}
        >
          <Image src={logo} alt="BizSearch Project" />
        </span>
      </Link>
      {/* メインナビゲーション */}
      <nav className="flex w-full items-center justify-between pl-16">
        {/* プロジェクトブレッドクラム */}
        <ul className="flex items-center gap-2">
          <li className="flex items-center gap-2">
            <span className="text-muted-foreground px-2">/</span>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                BizSearch Project
              </p>
            </div>
          </li>
        </ul>

        {/* 右側のアクション */}
        <div className="flex items-center gap-3">
          <AvatarMenu />
        </div>
      </nav>
    </header>
  );
}
