"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { PropertyWithPrimaryOwner } from "../action";
import { Users } from "lucide-react";

interface PropertyTableProps {
  properties: PropertyWithPrimaryOwner[];
  projectId: string;
}

export function PropertyTable({ properties, projectId }: PropertyTableProps) {
  const router = useRouter();

  return (
    <div
      className="rounded-lg border border-muted-foreground/20 bg-muted-foreground/5 overflow-hidden"
      style={{ height: "calc(100vh - 50px)" }}
    >
      <div className="h-full overflow-auto relative">
        <Table className="min-w-[1200px]">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="bg-muted-foreground/5 hover:bg-muted-foreground/10 border-b">
              <TableHead className="min-w-[300px] font-medium text-foreground bg-muted-foreground/5">
                不動産住所
              </TableHead>
              <TableHead className="min-w-[100px] font-medium text-foreground bg-muted-foreground/5">
                所有者数
              </TableHead>
              <TableHead className="min-w-[150px] font-medium text-foreground bg-muted-foreground/5">
                代表所有者
              </TableHead>
              <TableHead className="min-w-[300px] font-medium text-foreground bg-muted-foreground/5">
                所有者住所
              </TableHead>
              <TableHead className="min-w-[200px] font-medium text-foreground bg-muted-foreground/5">
                会社名
              </TableHead>
              <TableHead className="min-w-[100px] font-medium text-foreground bg-muted-foreground/5">
                役職
              </TableHead>
              <TableHead className="min-w-[100px] font-medium text-foreground bg-muted-foreground/5">
                ステータス
              </TableHead>
              <TableHead className="min-w-[80px] font-medium text-foreground bg-muted-foreground/5">
                追加日
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  物件データがありません
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow
                  key={property.project_property_id}
                  className="hover:bg-muted-foreground/10 transition-colors cursor-pointer"
                  onClick={() => {
                    if (property.primary_owner?.id) {
                      router.push(
                        `/projects/${projectId}/${property.primary_owner.id}`
                      );
                    }
                  }}
                >
                  <TableCell className="font-medium">
                    {property.property_address}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-muted-foreground" />
                      <span>{property.owner_count}</span>
                      {property.owner_count > 1 && (
                        <Badge variant="outline" className="text-xs">
                          共有
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{property.primary_owner?.name || "-"}</TableCell>
                  <TableCell className="text-sm">
                    {property.primary_owner?.address || "-"}
                  </TableCell>
                  <TableCell>
                    {property.primary_owner?.company?.name || "-"}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const owner = property.primary_owner;
                      if (!owner) {
                        return (
                          <Badge
                            variant="secondary"
                            className="bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20"
                          >
                            未調査
                          </Badge>
                        );
                      }

                      // 調査完了フラグが立っている場合
                      if (owner.investigation_completed) {
                        return (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20">
                            調査済み
                          </Badge>
                        );
                      }

                      // 会社情報がある場合は調査中
                      if (owner.companies_count && owner.companies_count > 0) {
                        return (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/20">
                            調査中
                          </Badge>
                        );
                      }

                      // それ以外は未調査
                      return (
                        <Badge
                          variant="secondary"
                          className="bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20"
                        >
                          未調査
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(property.added_at), "MM/dd", {
                      locale: ja,
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
