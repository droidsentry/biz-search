"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GeocodingLoadingDialogProps {
  open: boolean;
  totalCount: number;
  onCancel?: () => void;
}

export function GeocodingLoadingDialog({
  open,
  totalCount,
  onCancel,
}: GeocodingLoadingDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>位置情報を取得中...</AlertDialogTitle>
          <AlertDialogDescription>
            {totalCount}件の住所を処理しています
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-8 flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            処理が完了するまでしばらくお待ちください
          </p>
        </div>
        {onCancel && (
          <AlertDialogFooter>
            <AlertDialogAction onClick={onCancel}>
              バックグラウンドで続行
            </AlertDialogAction>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
