"use client";

import { signIn } from "@/lib/actions/auth/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/schemas/auth";
import { Login } from "@/lib/types/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Form as FormProvider,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import logo from "@/public/logo.png";

export function Form() {
  const [isPending, startTransition] = useTransition();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("from");

  const form = useForm<Login>({
    mode: "onChange",
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (data: Login) => {
    startTransition(async () => {
      await signIn(data)
        .then(() => {
          toast.success("ログインしました");
          if (returnUrl) {
            router.push(returnUrl);
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
            ログイン
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            アカウントにログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メールアドレス</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>パスワード</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={passwordVisible ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          minLength={6}
                          className="pr-10"
                          {...field}
                        />
                        <Button
                          size="icon"
                          type="button"
                          className="absolute top-0 right-0"
                          variant="ghost"
                          onClick={() => setPasswordVisible((v) => !v)}
                        >
                          {passwordVisible ? (
                            <Eye size={18} />
                          ) : (
                            <EyeOff size={18} />
                          )}
                          <span className="sr-only">
                            {passwordVisible
                              ? "パスワードを非表示にする"
                              : "パスワードを表示する"}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={!isValid || isSubmitting || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ログイン中...
                  </>
                ) : (
                  "ログイン"
                )}
              </Button>
            </form>
          </FormProvider>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
          <p>
            アカウントをお持ちでない方は
            <br />
            管理者にお問い合わせください
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
