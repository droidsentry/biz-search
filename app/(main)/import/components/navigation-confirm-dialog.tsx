"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface NavigationConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedCount: number;
  projectName?: string;
}

export function NavigationConfirmDialog({
  open,
  onOpenChange,
  savedCount,
  projectName,
}: NavigationConfirmDialogProps) {
  const router = useRouter();

  const handleNavigate = () => {
    toast.success("プロジェクト一覧に移動します");
    onOpenChange(false);
    router.push("/projects");
  };

  const handleStay = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <DialogTitle>保存が完了しました</DialogTitle>
          </div>
          <DialogDescription>
            {projectName && (
              <span className="font-medium text-foreground">
                プロジェクト「{projectName}」に
              </span>
            )}
            {savedCount}件の物件情報を保存しました。
            <br />
            プロジェクト一覧に移動しますか？
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button type="button" variant="outline" onClick={handleStay}>
              とどまる
            </Button>
            <Button type="button" onClick={handleNavigate} className="gap-2">
              プロジェクト一覧へ
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
