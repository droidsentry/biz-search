"use client";

import PasswordForm from "@/components/auth/password-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { updatePassword } from "@/lib/actions/auth/supabase";
import { passwordUpdateSchema } from "@/lib/schemas/auth";
import { PasswordUpdate } from "@/lib/types/auth";
import logo from "@/public/logo.png";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function PasswordUpdateForm() {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const fromPath = searchParams.get("from");
  const router = useRouter();
  const form = useForm<PasswordUpdate>({
    mode: "onChange",
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      password: "",
    },
  });
  const { isSubmitting, isValid, isValidating } = form.formState;

  const onSubmit = async (data: PasswordUpdate) => {
    startTransition(async () => {
      await updatePassword(data)
        .then(() => {
          toast.success("パスワードを設定しました。");
          if (fromPath) {
            router.push(fromPath);
          } else {
            router.push("/dashboard");
          }
        })
        .catch((error: Error) => {
          toast.error(error.message);
        });
    });
  };

  return (
    <div className="flex h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[400px] border-border bg-card">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <Image src={logo} alt="BizSearch" width={48} height={48} />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            パスワードの更新
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            新しいパスワードを設定してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <PasswordForm
                form={form}
                name="password"
                autoComplete="new-password"
              />

              <Button
                type="submit"
                className="w-full"
                disabled={!isValid || isValidating || isSubmitting || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    更新中...
                  </>
                ) : (
                  "パスワードを更新"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
