"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth/supabase";
import { Loader2Icon, LogOutIcon, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

export default function AvatarMenu() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSignOut = async () => {
    startTransition(async () => {
      await signOut();
    });
  }

  // キーボードショートカットの実装
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ⌘S (Cmd+S) で設定ページに移動
      if (event.key === 's' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        router.push('/settings');
      }
      
      // ⇧⌘Q (Shift+Cmd+Q) でログアウト
      if (event.key === 'Q' && (event.metaKey || event.ctrlKey) && event.shiftKey) {
        event.preventDefault();
        signOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline" className="rounded-full">
          <Avatar className="size-8">
            <AvatarImage src="/avatar.png" alt="User" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>マイアカウント</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center w-full">
            <Settings className="mr-2 size-4" />
            <span>設定</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

      <DropdownMenuItem className="text-red-600 dark:text-red-400" onSelect={(event) => {
          event.preventDefault();
          handleSignOut();
        }} disabled={isPending}>
        {isPending ? (
            <>
            <Loader2Icon
              className="animate-spin text-muted-foreground mr-2 size-4"
            />
            <span className="text-muted-foreground">ログアウト中...</span>
            </>
        ) : (
          <>
            <LogOutIcon size={20} className="text-muted-foreground mr-2 size-4" />
            <span className="">ログアウト</span>
          </>
          )}
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
      </DropdownMenuItem>
      
      </DropdownMenuContent>
    </DropdownMenu>
  );
}