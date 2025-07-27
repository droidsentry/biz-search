"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth/supabase";
import { User } from "@supabase/supabase-js";
import { Loader2Icon, LogOutIcon, Settings } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

export default function AvatarMenu({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();
  const email = user.email || "";
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="rounded-full hover:cursor-pointer relative"
        >
          <Avatar className="size-10">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback>{avatarText}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1 px-2 py-1.5">
            <p className="text-sm font-medium leading-none">
              {display_name ? `${display_name} ( ${username} )` : username}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/account/settings" className="flex items-center w-full">
            <Settings className="mr-2 size-4" />
            <span>アカウント設定</span>
          </Link>
        </DropdownMenuItem>

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
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
