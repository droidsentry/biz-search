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
import { User } from "@supabase/supabase-js";
import { Loader2Icon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

export default function AvatarMenu({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const display_name = user.user_metadata.display_name || "";
  const username = user.user_metadata.username || "";
  const avatarText = display_name
    ? display_name.substring(0, 2).toUpperCase()
    : username.substring(0, 2).toUpperCase();
  const encodedUsername = encodeURIComponent(username);
  const avatarUrl = `https://avatar.vercel.sh/${encodedUsername}.svg?text=${avatarText}`;

  const handleSignOut = async () => {
    startTransition(async () => {
      await signOut();
    });
  };

  // キーボードショートカットの実装
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ⌘S (Cmd+S) で設定ページに移動
      if (event.key === "s" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        router.push("/settings");
      }

      // ⇧⌘Q (Shift+Cmd+Q) でログアウト
      if (
        event.key === "Q" &&
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey
      ) {
        event.preventDefault();
        signOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="rounded-full hover:cursor-pointer relative"
        >
          <Avatar className="size-8">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback>{avatarText}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>マイアカウント</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 dark:text-red-400"
          onSelect={(event) => {
            event.preventDefault();
            handleSignOut();
          }}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2Icon className="animate-spin text-muted-foreground mr-2 size-4" />
              <span className="text-muted-foreground">ログアウト中...</span>
            </>
          ) : (
            <>
              <LogOutIcon
                size={20}
                className="text-muted-foreground mr-2 size-4"
              />
              <span className="">ログアウト</span>
            </>
          )}
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
