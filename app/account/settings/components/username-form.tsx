"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usernameSchema } from "@/lib/schemas/account";
import { UsernameFormData } from "@/lib/types/account";
import { updateUsername } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { CardContent, CardDescription } from "@/components/ui/card";

interface UsernameFormProps {
  currentUsername?: string;
}

export function UsernameForm({ currentUsername }: UsernameFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const form = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: currentUsername || "",
    },
  });

  const onSubmit = async (data: UsernameFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await updateUsername(data);

      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "ユーザー名を更新しました" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "予期せぬエラーが発生しました" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <CardContent>
        <Input
          id="username"
          {...form.register("username")}
          placeholder="ユーザー名を入力"
          disabled={isLoading}
          className="w-2/5 mb-6"
        />
        {form.formState.errors.username && (
          <p className="text-sm text-destructive">
            {form.formState.errors.username.message}
          </p>
        )}

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <div className="flex justify-between items-center border-t px-7 pt-3">
        <CardDescription className="text-sm">
          最大10文字まで設定できます
        </CardDescription>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              更新中...
            </>
          ) : (
            "保存"
          )}
        </Button>
      </div>
    </form>
  );
}
