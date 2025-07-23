"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteSearchPattern } from "../action";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SearchPatternDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName?: string;
  patternId: string;
}

export function SearchPatternDeleteModal({
  isOpen,
  onClose,
  currentName = "この検索パターン",
  patternId,
}: SearchPatternDeleteModalProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteSearchPattern(patternId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success("検索パターンを削除しました");
        router.push("/search");
      }
    } catch (error) {
      console.error("削除エラー:", error);
      toast.error("予期せぬエラーが発生しました");
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>検索パターンを削除</AlertDialogTitle>
          <AlertDialogDescription>
            「{currentName}」を削除します。この操作は元に戻せません。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            キャンセル
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "削除中..." : "削除"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
