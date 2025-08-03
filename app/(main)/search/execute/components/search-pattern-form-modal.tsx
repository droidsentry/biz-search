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
import { SearchFormData } from "@/lib/schemas/serpapi";
import { SearchPattern } from "@/lib/types/serpapi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useTransition } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createSearchPattern, updateSearchPattern } from "../action";

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
  patternId?: string | null;
  onSaveSuccess: (data: SearchPattern) => void;
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
  const formContext = useFormContext<SearchFormData>();
  const [isPending, startTransition] = useTransition();
  // 現在のフォームデータから検索パラメータを取得
  const currentFormData = formContext.getValues();

  const form = useForm<PatternFormData>({
    resolver: zodResolver(patternFormSchema),
    mode: "onChange",
    defaultValues: {
      name: currentName,
      description: currentDescription,
    },
  });

  // モーダルが開かれた時、またはcurrentName/currentDescriptionが変更された時にフォームをリセット
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: currentName,
        description: currentDescription,
      });
    }
  }, [isOpen, currentName, currentDescription, form]);

  const handleSubmit = async (data: PatternFormData) => {
    startTransition(async () => {
      if (mode === "create") {
        // 詳細オプションがオフの場合、追加キーワードと検索サイトを除外
        const formDataToSave = {
          ...currentFormData,
          additionalKeywords: currentFormData.isAdvancedSearchEnabled 
            ? currentFormData.additionalKeywords 
            : [],
          searchSites: currentFormData.isAdvancedSearchEnabled 
            ? currentFormData.searchSites 
            : [],
        };
        
        const result = await createSearchPattern(
          data.name,
          data.description || null,
          formDataToSave
        ).catch((error) => {
          toast.error(error.message);
        });

        if (result) {
          toast.success("検索パターンを保存しました");
          // URLを更新せずにモーダルを閉じるだけにする
          // 保存成功を親コンポーネントに通知
          if (onSaveSuccess) {
            // createSearchPatternの戻り値をSearchPattern型に変換
            const newPattern: SearchPattern = {
              id: result.id,
              searchPatternName: result.name,
              searchPatternDescription: result.description || "",
              googleCustomSearchParams: result.googleCustomSearchParams,
              usageCount: 0,
              createdAt: result.created_at,
              updatedAt: result.updated_at,
              lastUsedAt: result.last_used_at,
            };
            onSaveSuccess(newPattern);
            form.reset();
            onClose();
          }
        }
      } else if (mode === "edit" && patternId) {
        // 詳細オプションがオフの場合、追加キーワードと検索サイトを除外
        const formDataToSave = {
          ...currentFormData,
          additionalKeywords: currentFormData.isAdvancedSearchEnabled 
            ? currentFormData.additionalKeywords 
            : [],
          searchSites: currentFormData.isAdvancedSearchEnabled 
            ? currentFormData.searchSites 
            : [],
        };
        
        const result = await updateSearchPattern(patternId, {
          name: data.name,
          description: data.description || null,
          google_custom_search_params: formDataToSave,
        });

        toast.success("検索パターンを更新しました");
        const updatedPattern: SearchPattern = {
          id: result.id,
          searchPatternName: result.name,
          searchPatternDescription: result.description,
          googleCustomSearchParams: result.googleCustomSearchParams,
          usageCount: result.usage_count,
          createdAt: result.created_at,
          updatedAt: result.updated_at,
          lastUsedAt: result.last_used_at,
        };
        onSaveSuccess(updatedPattern);
        onClose();
      }
    });
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
                      disabled={isPending}
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
                      disabled={isPending}
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
                disabled={isPending}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "処理中..." : mode === "create" ? "保存" : "更新"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
