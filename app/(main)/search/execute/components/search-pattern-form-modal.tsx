"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createSearchPattern, updateSearchPattern } from "../action";
import { useGoogleCustomSearchForm } from "@/components/providers/google-custom-search-form";
import { useFormContext } from "react-hook-form";
import { GoogleCustomSearchPattern } from "@/lib/types/custom-search";
import { googleCustomSearchPatternSchema } from "@/lib/schemas/custom-search";
import { useState } from "react";

// パターン保存用のスキーマ
const patternFormSchema = z.object({
  name: z.string().min(1, "パターン名を入力してください"),
  description: z.string().optional(),
});

type PatternFormData = z.infer<typeof patternFormSchema>;

interface SearchPatternFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName?: string;
  currentDescription?: string;
  mode: "create" | "edit";
  patternId?: string;
  projectId: string;
  onSaveSuccess?: (patternId: string, patternData?: any) => void;
}

export function SearchPatternFormModal({
  isOpen,
  onClose,
  currentName = "",
  currentDescription = "",
  mode,
  patternId,
  onSaveSuccess,
}: SearchPatternFormModalProps) {
  const router = useRouter();
  const formContext = useFormContext<GoogleCustomSearchPattern>();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PatternFormData>({
    resolver: zodResolver(patternFormSchema),
    defaultValues: {
      name: currentName,
      description: currentDescription,
    },
  });

  const handleSubmit = async (data: PatternFormData) => {
    console.log("handleSubmit", data);
    setIsLoading(true);

    try {
      if (mode === "create") {
        // 現在のフォームデータから検索パラメータを取得
        const currentFormData = formContext.getValues();

        const result = await createSearchPattern(
          data.name,
          data.description || null,
          currentFormData.googleCustomSearchParams
        );

        if (result.error) {
          toast.error(result.error);
          return;
        }

        if (result.success && result.data) {
          toast.success("検索パターンを保存しました");
          // URLを更新せずにモーダルを閉じるだけにする
          onClose();
          // 保存成功を親コンポーネントに通知
          if (onSaveSuccess) {
            onSaveSuccess(result.data.id, result.data);
          }
        }
      } else if (mode === "edit" && patternId) {
        const result = await updateSearchPattern(patternId, {
          name: data.name,
          description: data.description || null,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        if (result.success) {
          toast.success("検索パターンを更新しました");
          router.refresh();
          onClose();
        }
      }
    } catch (error) {
      console.error("エラー:", error);
      toast.error("予期せぬエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "検索パターンを保存" : "検索パターンを編集"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "この検索条件をパターンとして保存します"
              : "パターンの名前と説明を編集できます"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    パターン名 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例: 東京都内の経営者"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明（任意）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="このパターンの説明を入力"
                      rows={3}
                      className="resize-none"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "処理中..." : mode === "create" ? "保存" : "更新"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
