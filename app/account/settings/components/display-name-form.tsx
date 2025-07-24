"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { displayNameSchema } from "@/lib/schemas/account";
import { DisplayNameFormData } from "@/lib/types/account";
import { updateDisplayName } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { CardContent, CardDescription, CardFooter } from "@/components/ui/card";

interface DisplayNameFormProps {
  currentDisplayName?: string;
}

export function DisplayNameForm({ currentDisplayName }: DisplayNameFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const form = useForm<DisplayNameFormData>({
    resolver: zodResolver(displayNameSchema),
    defaultValues: {
      displayName: currentDisplayName || "",
    },
  });

  const onSubmit = async (data: DisplayNameFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await updateDisplayName(data);

      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "表示名を更新しました" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "予期せぬエラーが発生しました" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="">
      <CardContent>
        <Input
          id="displayName"
          {...form.register("displayName")}
          placeholder="表示名を入力"
          disabled={isLoading}
          className="w-2/5 mb-6"
        />
        {form.formState.errors.displayName && (
          <p className="text-sm text-destructive">
            {form.formState.errors.displayName.message}
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
        <Button type="submit" disabled={isLoading} size="sm" className="w-15">
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
