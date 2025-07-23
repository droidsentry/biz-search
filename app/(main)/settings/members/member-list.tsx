"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mail, MoreVertical, UserCog, UserMinus } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "system_owner" | "owner" | "editor" | "viewer";
  status: "active" | "pending";
  joinedAt: string;
  avatarUrl?: string;
}

// ダミーデータ
const members: Member[] = [
  {
    id: "1",
    name: "田中 太郎",
    email: "tanaka@example.com",
    role: "system_owner",
    status: "active",
    joinedAt: "2024-01-15",
  },
  {
    id: "2",
    name: "鈴木 花子",
    email: "suzuki@example.com",
    role: "owner",
    status: "active",
    joinedAt: "2024-02-20",
  },
  {
    id: "3",
    name: "佐藤 次郎",
    email: "sato@example.com",
    role: "editor",
    status: "active",
    joinedAt: "2024-03-10",
  },
  {
    id: "4",
    name: "山田 美咲",
    email: "yamada@example.com",
    role: "viewer",
    status: "pending",
    joinedAt: "2024-05-01",
  },
];

export function MemberList() {
  const getRoleLabel = (role: Member["role"]) => {
    switch (role) {
      case "system_owner":
        return "システム管理者";
      case "owner":
        return "オーナー";
      case "editor":
        return "編集者";
      case "viewer":
        return "閲覧者";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">メンバー</h2>
        <span className="text-sm text-muted-foreground">
          {members.length} 人
        </span>
      </div>

      <div className="border rounded-lg">
        {members.map((member, index) => (
          <div
            key={member.id}
            className={`flex items-center justify-between p-4 ${
              index !== members.length - 1 ? "border-b" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatarUrl} />
                <AvatarFallback className="bg-muted">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{member.name}</p>
                  {member.status === "pending" && (
                    <Badge variant="secondary" className="text-xs">
                      招待中
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {getRoleLabel(member.role)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(member.joinedAt).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">メニューを開く</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>役割を変更</span>
                  </DropdownMenuItem>
                  {member.status === "pending" && (
                    <DropdownMenuItem>
                      <Mail className="mr-2 h-4 w-4" />
                      <span>招待を再送信</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-destructive">
                    <UserMinus className="mr-2 h-4 w-4" />
                    <span>削除</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
