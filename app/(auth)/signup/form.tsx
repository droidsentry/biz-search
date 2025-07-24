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
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as FormProvider,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signup } from "@/lib/actions/auth/supabase";
import { extendedSignupSchema } from "@/lib/schemas/auth";
import { PasswordUpdate, Signup } from "@/lib/types/auth";
import logo from "@/public/logo.png";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function SignupForm({ user }: { user: User | null }) {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const fromPath = searchParams.get("from");
  const router = useRouter();
  const form = useForm<Signup>({
    mode: "onChange",
    resolver: zodResolver(extendedSignupSchema),
    defaultValues: {
      email: user?.email ?? "",
      username: "",
      password: "",
    },
  });
  const { isSubmitting, isValid, isValidating } = form.formState;

  const onSubmit = async (data: Signup) => {
    startTransition(async () => {
      await signup(data)
        .then(() => {
          toast.success("アカウントを作成しました。");
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
            アカウントの作成
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            ユーザー名とパスワードを設定してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ユーザー名</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="ユーザー名を入力"
                        autoComplete="username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メールアドレス</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        autoComplete="email"
                        {...field}
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
