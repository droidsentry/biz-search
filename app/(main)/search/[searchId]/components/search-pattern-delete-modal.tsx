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


interface SearchPatternDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName?: string;
}

export function SearchPatternDeleteModal({
  isOpen,
  onClose,
}: SearchPatternDeleteModalProps) {


  const handleDelete = () => {
    console.log("handleDelete");
    toast.success("検索パターンを削除しました");

    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>検索パターンを削除</AlertDialogTitle>
          <AlertDialogDescription>
            この検索パターンを削除します。 この操作は元に戻せません。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            削除
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
