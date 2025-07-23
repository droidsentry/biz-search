"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tables } from "@/lib/types/database";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteOwnerCompanyAction, updateOwnerCompanyAction } from "../action";

interface CompanyInfoSidebarProps {
  ownerId: string;
  initialCompanies: Tables<"owner_companies">[];
}

export function CompanyInfoSidebar({
  ownerId,
  initialCompanies,
}: CompanyInfoSidebarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 3つの会社情報スロット（rank 1-3）
  const [companies, setCompanies] = useState(() => {
    const companyByRank: Record<number, Tables<"owner_companies"> | null> = {
      1: null,
      2: null,
      3: null,
    };
    initialCompanies.forEach((company) => {
      companyByRank[company.rank] = company;
    });
    return companyByRank;
  });

  // 編集中のデータ
  const [editingData, setEditingData] = useState<
    Record<
      number,
      {
        companyName: string;
        companyNumber: string;
        position: string;
        sourceUrl: string;
      }
    >
  >({
    1: {
      companyName: companies[1]?.company_name || "",
      companyNumber: companies[1]?.company_number || "",
      position: companies[1]?.position || "",
      sourceUrl: companies[1]?.source_url || "",
    },
    2: {
      companyName: companies[2]?.company_name || "",
      companyNumber: companies[2]?.company_number || "",
      position: companies[2]?.position || "",
      sourceUrl: companies[2]?.source_url || "",
    },
    3: {
      companyName: companies[3]?.company_name || "",
      companyNumber: companies[3]?.company_number || "",
      position: companies[3]?.position || "",
      sourceUrl: companies[3]?.source_url || "",
    },
  });

  const handleSave = async (rank: 1 | 2 | 3) => {
    const data = editingData[rank];
    if (!data.companyName || !data.sourceUrl) {
      toast.error("会社名と出典URLは必須です");
      return;
    }

    startTransition(async () => {
      const result = await updateOwnerCompanyAction(ownerId, {
        companyName: data.companyName,
        companyNumber: data.companyNumber || undefined,
        position: data.position || undefined,
        sourceUrl: data.sourceUrl,
        rank,
      }).catch((error) => {
        toast.error("会社情報の更新に失敗しました エラー:" + error.message);
        return false;
      });

      if (result) {
        toast.success(`会社情報${rank}を保存しました`);
        router.refresh();
      }
    });
  };

  const handleDelete = async (rank: 1 | 2 | 3) => {
    if (!companies[rank]) return;

    startTransition(async () => {
      const result = await deleteOwnerCompanyAction(ownerId, rank).catch(
        (error) => {
          toast.error("会社情報の削除に失敗しました エラー:" + error.message);
          return false;
        }
      );

      if (result) {
        toast.success(`会社情報${rank}を削除しました`);
        setCompanies({ ...companies, [rank]: null });
        setEditingData({
          ...editingData,
          [rank]: {
            companyName: "",
            companyNumber: "",
            position: "",
            sourceUrl: "",
          },
        });
        router.refresh();
      }
    });
  };

  const updateField = (rank: number, field: string, value: string) => {
    setEditingData({
      ...editingData,
      [rank]: {
        ...editingData[rank],
        [field]: value,
      },
    });
  };

  return (
    <div className="bg-background border border-muted-foreground/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-6">調査結果記録</h3>

      <div className="space-y-8">
        {[1, 2, 3].map((rank) => (
          <div
            key={rank}
            className="space-y-4 pb-6 border-b border-muted-foreground/20 last:border-0"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium">会社情報 {rank}</h4>
              {companies[rank as keyof typeof companies] && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(rank as 1 | 2 | 3)}
                  disabled={isPending}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor={`company-name-${rank}`}>会社名 *</Label>
                <Input
                  id={`company-name-${rank}`}
                  value={editingData[rank].companyName}
                  onChange={(e) =>
                    updateField(rank, "companyName", e.target.value)
                  }
                  placeholder="株式会社○○"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`company-number-${rank}`}>会社電話番号</Label>
                <Input
                  id={`company-number-${rank}`}
                  value={editingData[rank].companyNumber}
                  onChange={(e) =>
                    updateField(rank, "companyNumber", e.target.value)
                  }
                  placeholder="03-1234-5678"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`position-${rank}`}>役職</Label>
                <Input
                  id={`position-${rank}`}
                  value={editingData[rank].position}
                  onChange={(e) =>
                    updateField(rank, "position", e.target.value)
                  }
                  placeholder="代表取締役"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`source-url-${rank}`}>出典URL *</Label>
                <Input
                  id={`source-url-${rank}`}
                  value={editingData[rank].sourceUrl}
                  onChange={(e) =>
                    updateField(rank, "sourceUrl", e.target.value)
                  }
                  placeholder="https://example.com"
                  type="url"
                  disabled={isPending}
                />
              </div>

              <Button
                onClick={() => handleSave(rank as 1 | 2 | 3)}
                disabled={
                  isPending ||
                  !editingData[rank].companyName ||
                  !editingData[rank].sourceUrl
                }
                size="sm"
                className="w-full"
              >
                {companies[rank as keyof typeof companies] ? "更新" : "保存"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
