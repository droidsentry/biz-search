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
import { Tables } from "@/lib/types/database";
import { deleteAccountAction } from "../actions";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, AlertCircle, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Profile = Tables<"profiles">;

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  profile,
}: DeleteAccountDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteAccountAction({
        userId: profile.id,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("アカウントを削除しました");
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("アカウントの削除に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // 90日後の日付を計算
  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + 90);
  const formattedDate = deletionDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>アカウントを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                <span className="font-semibold">{profile.display_name || profile.username}</span> のアカウントを削除します。
              </p>
              
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  この操作により、ユーザーは即座にアクセスできなくなります。
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg p-3 bg-muted/50 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">完全削除予定日</span>
                </div>
                <p className="text-sm font-medium">{formattedDate}</p>
                <p className="text-xs text-muted-foreground">
                  アカウントデータは90日間保持され、その後完全に削除されます
                </p>
              </div>

              <p className="text-sm text-destructive font-medium">
                この操作は取り消すことができません。
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                削除中...
              </>
            ) : (
              "アカウントを削除"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}