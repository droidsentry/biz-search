"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@supabase/supabase-js";
import { ExternalLinkIcon, MailOpenIcon } from "lucide-react";
import Link from "next/link";

export function ResetPasswordCard({ user }: { user: User }) {
  return (
    <Card className="shadow-border pb-3">
      <CardHeader className="border-b flex items-center">
        <CardTitle className="text-xl font-semibold text-center">
          パスワード
        </CardTitle>
      </CardHeader>
      <CardContent className="mb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <MailOpenIcon className="size-7 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold text-sm">メール</h3>
              <p className="text-sm text-muted-foreground font-semibold">
                {user.email}
              </p>
            </div>
          </div>
          <Button variant="outline" className="gap-2 w-50" asChild>
            <Link
              href={`/reset-password?from=/account/settings/authentication`}
              target="_blank"
            >
              パスワードを更新する
              <ExternalLinkIcon className="size-4 text-muted-foreground" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
