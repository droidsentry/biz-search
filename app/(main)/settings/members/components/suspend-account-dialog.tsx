"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTransition } from "react";
import { suspendAccountAction } from "../actions";
import { Tables } from "@/lib/types/database";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

type Profile = Tables<"profiles">;

interface SuspendAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
}

export function SuspendAccountDialog({
  open,
  onOpenChange,
  profile,
}: SuspendAccountDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleSuspendAccount = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("userId", profile.id);
      formData.append("isActive", (!profile.is_active).toString());

      const result = await suspendAccountAction(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          profile.is_active
            ? "アカウントを停止しました"
            : "アカウントを再開しました"
        );
        onOpenChange(false);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>
              {profile.is_active ? "アカウントを停止" : "アカウントを再開"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {profile.is_active ? (
              <>
                {profile.display_name || profile.username}
                のアカウントを停止します。
                <br />
                停止されたアカウントはログインできなくなります。
              </>
            ) : (
              <>
                {profile.display_name || profile.username}
                のアカウントを再開します。
                <br />
                再開後、通常通りログインできるようになります。
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSuspendAccount}
            disabled={isPending}
            className={profile.is_active ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {isPending
              ? "処理中..."
              : profile.is_active
              ? "停止する"
              : "再開する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}