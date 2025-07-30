"use client";

import { Button } from "@/components/ui/button";
import { Check, AlertCircle, HelpCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { toggleInvestigationStatusAction } from "../actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

interface InvestigationStatusButtonProps {
  ownerId: string;
  initialStatus: "pending" | "completed" | "unknown";
}

export function InvestigationStatusButtons({
  ownerId,
  initialStatus,
}: InvestigationStatusButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<
    "pending" | "completed" | "unknown" | null
  >(null);
  const [status, setStatus] = useState(initialStatus);

  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const handleStatusChange = async (
    newStatus: "pending" | "completed" | "unknown"
  ) => {
    if (newStatus === status) return;

    setIsLoading(true);
    setLoadingStatus(newStatus);

    try {
      const result = await toggleInvestigationStatusAction(ownerId, newStatus);

      if (result.success && result.newStatus) {
        setStatus(result.newStatus);
        toast.success(result.message);

        // 調査完了、不明に変更した場合、物件一覧に遷移
        if (
          result.newStatus === "completed" ||
          result.newStatus === "unknown"
        ) {
          router.push(`/projects/${projectId}`);
        }
      } else if (!result.success && result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("エラーが発生しました");
      console.error("Investigation status change error:", error);
    } finally {
      setIsLoading(false);
      setLoadingStatus(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={() => handleStatusChange("pending")}
          disabled={isLoading}
          variant={status === "pending" ? "default" : "outline"}
          size="sm"
          className={cn(
            "transition-all min-w-32",
            status === "pending"
              ? "bg-gray-600 hover:bg-gray-700 text-white"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          {isLoading && loadingStatus === "pending" ? (
            <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              <AlertCircle className="size-4 mr-1.5 flex-shrink-0" />
              <span>未完了</span>
            </>
          )}
        </Button>

        <Button
          onClick={() => handleStatusChange("unknown")}
          disabled={isLoading}
          variant={status === "unknown" ? "default" : "outline"}
          size="sm"
          className={cn(
            "transition-all min-w-32",
            status === "unknown"
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : "hover:bg-orange-100 dark:hover:bg-orange-800/20 hover:text-orange-700 dark:hover:text-orange-400"
          )}
        >
          {isLoading && loadingStatus === "unknown" ? (
            <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              <HelpCircle className="size-4 mr-1 flex-shrink-0" />
              <span className="text-xs">不明</span>
            </>
          )}
        </Button>

        <Button
          onClick={() => handleStatusChange("completed")}
          disabled={isLoading}
          variant={status === "completed" ? "default" : "outline"}
          size="sm"
          className={cn(
            "transition-all min-w-32",
            status === "completed"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "hover:bg-green-100 dark:hover:bg-green-800/20 hover:text-green-700 dark:hover:text-green-400"
          )}
        >
          {isLoading && loadingStatus === "completed" ? (
            <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              <Check className="size-4 mr-1.5 flex-shrink-0" />
              <span>調査完了</span>
            </>
          )}
        </Button>
      </div>
      <p className="text-right text-xs text-muted-foreground">
        ※ 不明、調査完了にすると自動的に物件一覧に戻ります
      </p>
    </div>
  );
}
