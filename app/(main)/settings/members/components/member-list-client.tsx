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
import { Tables } from "@/lib/types/database";
import { Mail, MoreVertical, UserCog, UserMinus, UserX2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChangeRoleDialog } from "./change-role-dialog";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { SuspendAccountDialog } from "./suspend-account-dialog";
import { SendAuthEmailDialog } from "./send-auth-email-dialog";

type Profile = Tables<"profiles">;

interface MemberListClientProps {
  profiles: Profile[];
  currentUserId: string;
}

export function MemberListClient({
  profiles,
  currentUserId,
}: MemberListClientProps) {
  const router = useRouter();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAuthEmailDialog, setShowAuthEmailDialog] = useState(false);
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "system_owner":
        return "システム管理者";
      case "user":
        return "通常ユーザー";
      default:
        return role;
    }
  };

  const getAvatarText = (profile: Profile) => {
    const name =
      profile.display_name || profile.username || profile.email || "";
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarUrl = (profile: Profile) => {
    // if (profile.avatar_url) {
    //   return profile.avatar_url;
    // }
    const encodedName = encodeURIComponent(
      profile.username || profile.email || ""
    );
    const avatarText = getAvatarText(profile);
    return `https://avatar.vercel.sh/${encodedName}.svg?text=${avatarText}`;
  };

  const handleRoleChange = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowRoleDialog(true);
  };

  const handleSuspendAccount = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowSuspendDialog(true);
  };

  const handleDeleteAccount = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowDeleteDialog(true);
  };

  const handleSendAuthEmail = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowAuthEmailDialog(true);
  };

  const handleRoleDialogClose = (open: boolean) => {
    if (!open) {
      setShowRoleDialog(false);
      setSelectedProfile(null);
      router.refresh(); // データを再取得
    }
  };

  const handleSuspendDialogClose = (open: boolean) => {
    if (!open) {
      setShowSuspendDialog(false);
      setSelectedProfile(null);
      router.refresh(); // データを再取得
    }
  };

  const handleDeleteDialogClose = (open: boolean) => {
    if (!open) {
      setShowDeleteDialog(false);
      setSelectedProfile(null);
      router.refresh(); // データを再取得
    }
  };

  const handleAuthEmailDialogClose = (open: boolean) => {
    if (!open) {
      setShowAuthEmailDialog(false);
      setSelectedProfile(null);
      router.refresh(); // データを再取得
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">メンバー</h2>
        <span className="text-sm text-muted-foreground">
          {profiles.length} 人
        </span>
      </div>

      <div className="border rounded-lg">
        {profiles.map((profile, index) => (
          <div
            key={profile.id}
            className={`flex items-center justify-between p-4 ${
              index !== profiles.length - 1 ? "border-b" : ""
            } ${profile.deleted_at ? "opacity-60 bg-muted/30" : ""}`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={getAvatarUrl(profile)}
                  alt={profile.display_name || profile.username || ""}
                />
                <AvatarFallback className="bg-muted">
                  {getAvatarText(profile)}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {profile.display_name || profile.username}
                  </p>
                  {profile.id === currentUserId && (
                    <Badge variant="secondary" className="text-xs">
                      あなた
                    </Badge>
                  )}
                  {!profile.is_active && (
                    <Badge variant="destructive" className="text-xs">
                      停止中
                    </Badge>
                  )}
                  {profile.deleted_at && (
                    <Badge variant="outline" className="text-xs">
                      削除済み
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {getRoleLabel(profile.role || "")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile.deleted_at ? (
                    <>
                      削除日:{" "}
                      {new Date(profile.deleted_at).toLocaleDateString(
                        "ja-JP",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </>
                  ) : (
                    <>
                      登録日:{" "}
                      {new Date(profile.created_at).toLocaleDateString(
                        "ja-JP",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </>
                  )}
                </p>
              </div>

              {profile.id !== currentUserId && !profile.deleted_at && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">メニューを開く</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onSelect={() => handleRoleChange(profile)}
                    >
                      <UserCog className="mr-2 size-4" />
                      <span>役割を変更する</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleSendAuthEmail(profile)}
                    >
                      <Mail className="mr-2 size-4" />
                      <span>認証メールを送信</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={
                        profile.is_active ? "text-red-400" : "text-green-600"
                      }
                      onSelect={() => handleSuspendAccount(profile)}
                    >
                      <UserX2Icon className="mr-2 size-4" />
                      <span>
                        {profile.is_active
                          ? "アカウントを停止する"
                          : "アカウントを再開する"}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500"
                      onSelect={() => handleDeleteAccount(profile)}
                    >
                      <UserMinus className="mr-2 size-4" />
                      <span>アカウントを削除する</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 役割変更ダイアログ */}
      {selectedProfile && (
        <ChangeRoleDialog
          open={showRoleDialog}
          onOpenChange={handleRoleDialogClose}
          profile={selectedProfile}
        />
      )}

      {/* アカウント停止ダイアログ */}
      {selectedProfile && (
        <SuspendAccountDialog
          open={showSuspendDialog}
          onOpenChange={handleSuspendDialogClose}
          profile={selectedProfile}
        />
      )}

      {/* アカウント削除ダイアログ */}
      {selectedProfile && (
        <DeleteAccountDialog
          open={showDeleteDialog}
          onOpenChange={handleDeleteDialogClose}
          profile={selectedProfile}
        />
      )}

      {/* 認証メール送信ダイアログ */}
      {selectedProfile && (
        <SendAuthEmailDialog
          open={showAuthEmailDialog}
          onOpenChange={handleAuthEmailDialogClose}
          profile={selectedProfile}
        />
      )}
    </div>
  );
}
