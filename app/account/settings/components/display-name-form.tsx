"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateDisplayName } from "@/lib/actions/account";
import { displayNameSchema } from "@/lib/schemas/account";
import { DisplayNameFormData } from "@/lib/types/account";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface DisplayNameFormProps {
  currentDisplayName?: string | null;
}

export function DisplayNameForm({ currentDisplayName }: DisplayNameFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<DisplayNameFormData>({
    mode: "onChange",
    resolver: zodResolver(displayNameSchema),
    defaultValues: {
      displayName: currentDisplayName || "",
    },
  });

  const { isSubmitting, isValid, isValidating } = form.formState;

  const onSubmit = async (data: DisplayNameFormData) => {
    startTransition(async () => {
      await updateDisplayName(data)
        .then(() => {
          toast.success("表示名を更新しました");
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
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="表示名を入力"
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
        <div className="flex justify-between items-center border-t px-7 pt-3 ">
          <CardDescription className="text-sm">
            最大10文字まで設定できます。先頭の2文字がアイコンに表示されます。
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
