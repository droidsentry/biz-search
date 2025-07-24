"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UsernameFormData } from "@/lib/types/account";
import { updateUsername } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { CardContent, CardDescription } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { toast } from "sonner";
import { debouncedUsernameSchema } from "@/lib/schemas/auth";

interface UsernameFormProps {
  currentUsername?: string | null;
}

export function UsernameForm({ currentUsername }: UsernameFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UsernameFormData>({
    mode: "onChange",
    resolver: zodResolver(debouncedUsernameSchema),
    defaultValues: {
      username: currentUsername || "",
    },
  });

  const { isSubmitting, isValid, isValidating } = form.formState;

  const onSubmit = async (data: UsernameFormData) => {
    startTransition(async () => {
      await updateUsername(data)
        .then(() => {
          toast.success("ユーザー名を更新しました");
          form.reset(data);
        })
        .catch((error: Error) => {
          toast.error(error.message);
        });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="">
        <CardContent className="mb-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="ユーザー名を入力"
                    disabled={isPending}
                    className="w-2/5"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
        <div className="flex justify-between items-center border-t px-7 pt-3">
          <CardDescription className="text-sm">
            ユーザー名は英数字、アンダースコア、ハイフンのみ使用できます
          </CardDescription>
          <Button
            type="submit"
            disabled={!isValid || isValidating || isSubmitting || isPending}
            size="sm"
            className="w-28"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                更新中...
              </>
            ) : (
              "保存"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
