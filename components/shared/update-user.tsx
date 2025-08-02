"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UpdateUserProps {
  username: string | null | undefined;
}

export function UpdateUser({ username }: UpdateUserProps) {
  if (!username) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  // アバター用のテキストとURL生成（avatar-menu.tsxと同じロジック）
  const avatarText = username.substring(0, 2).toUpperCase();
  const encodedUsername = encodeURIComponent(username);
  const avatarUrl = `https://avatar.vercel.sh/${encodedUsername}.svg?text=${avatarText}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">{username}</span>
      <Avatar className="size-5">
        <AvatarImage src={avatarUrl} alt={username} />
        <AvatarFallback className="text-[10px]">{avatarText}</AvatarFallback>
      </Avatar>
    </div>
  );
}
