"use client";

import PasswordForm from "@/components/auth/password-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { loginWithEmailOrUsername } from "@/lib/actions/auth/supabase";
import { loginWithEmailOrUsernameSchema } from "@/lib/schemas/auth";
import { LoginWithEmailOrUsername } from "@/lib/types/auth";

import { Alert, AlertDescription } from "@/components/ui/alert";
import logo from "@/public/logo.png";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function LoginForm({ from }: { from?: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const returnUrl = from;

  const form = useForm<LoginWithEmailOrUsername>({
    mode: "onChange",
    resolver: zodResolver(loginWithEmailOrUsernameSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (data: LoginWithEmailOrUsername) => {
    startTransition(async () => {
      await loginWithEmailOrUsername(data)
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
          {from === "account_suspended" && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                アカウントが停止されています。管理者にお問い合わせください。
              </AlertDescription>
            </Alert>
          )}
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="emailOrUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メールアドレスまたはユーザー名</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="メールアドレスまたはユーザー名を入力"
                        autoComplete="emailOrUsername"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <PasswordForm
                form={form}
                name="password"
                autoComplete="current-password"
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
