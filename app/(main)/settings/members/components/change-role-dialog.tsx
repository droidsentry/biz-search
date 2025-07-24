"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useTransition } from "react";
import { changeRoleAction } from "../actions";
import { Tables } from "@/lib/types/database";
import { toast } from "sonner";

type Profile = Tables<"profiles">;

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
}

const roles = [
  { value: "system_owner", label: "システム管理者" },
  { value: "user", label: "通常ユーザー" },
];

export function ChangeRoleDialog({
  open,
  onOpenChange,
  profile,
}: ChangeRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState(profile.role || "user");
  const [isPending, startTransition] = useTransition();

  const handleChangeRole = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("userId", profile.id);
      formData.append("role", selectedRole);

      const result = await changeRoleAction(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("役割を変更しました");
        onOpenChange(false);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>役割を変更</AlertDialogTitle>
          <AlertDialogDescription>
            {profile.display_name || profile.username}の役割を変更します。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Select
            value={selectedRole}
            onValueChange={setSelectedRole}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleChangeRole}
            disabled={isPending || selectedRole === profile.role}
          >
            {isPending ? "変更中..." : "変更する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}