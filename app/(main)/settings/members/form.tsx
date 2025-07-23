"use client";

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteSchema } from "@/lib/schemas/invite";
import { Invite } from "@/lib/types/invite";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { inviteMember } from "./action";
import { Loader2 } from "lucide-react";

export function InviteMemberForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<Invite>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "system_owner",
    },
  });

  const { isValid, isValidating, isSubmitting } = form.formState;

  const handleSendInvite = async (formData: Invite) => {
    startTransition(async () => {
      await inviteMember(formData)
        .then(() => {
          toast.success("招待メールを送信しました");
        })
        .catch((error) => {
          toast.error("招待メールの送信に失敗しました エラー:" + error.message);
        });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>メンバーを招待</CardTitle>
        <CardDescription className="border-b pb-4">
          メールアドレスと役割を指定して、新しいメンバーを招待します
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSendInvite)}>
          <CardContent className="mb-4">
            <div className="grid gap-2 md:grid-cols-2 w-full pb-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メールアドレス</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-3 size-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="user@example.com"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>役割</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="役割を選択">
                            {field.value === "user" && "通常ユーザー"}
                            {field.value === "system_owner" && "システム管理者"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">
                          <div>
                            <div className="font-medium">通常ユーザー</div>
                            <div className="text-xs text-gray-500">
                              プロジェクトベースのアクセス権限
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="system_owner">
                          <div>
                            <div className="font-medium">システム管理者</div>
                            <div className="text-xs text-gray-500">
                              全プロジェクトへのアクセス権限
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t">
            <Button
              type="submit"
              disabled={isPending || !isValid || isSubmitting || isValidating}
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin size-4  mr-2" />
                  送信中...
                </>
              ) : (
                <>
                  <EnvelopeIcon className="size-4 mr-2" />
                  招待メールを送信
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
