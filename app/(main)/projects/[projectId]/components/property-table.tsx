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
import { ProjectPropertyView } from "@/lib/types/rpc";
import { toast } from "sonner";
import { extractRoomNumber } from "@/lib/utils/property-address";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UpdateUser } from "@/components/shared/update-user";
import { UpdateDate } from "@/components/shared/update-date";

interface PropertyTableProps {
  properties: ProjectPropertyView[];
  projectId: string;
}

export function PropertyTable({ properties, projectId }: PropertyTableProps) {
  const router = useRouter();

  return (
    <div
      className="rounded-lg border border-muted-foreground/20 bg-muted-foreground/5 overflow-hidden"
      // style={{ height: "calc(100vh - 50px)" }}
    >
      <ScrollArea className="h-full overflow-auto relative">
        <Table className="min-w-[1200px]">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="bg-muted-foreground/5 hover:bg-muted-foreground/10 border-b">
              <TableHead className="min-w-[50px] text-center font-medium text-foreground bg-muted-foreground/5">
                号室
              </TableHead>
              <TableHead className="font-medium text-foreground bg-muted-foreground/5">
                代表所有者
              </TableHead>
              <TableHead className="font-medium text-foreground bg-muted-foreground/5">
                所有者住所
              </TableHead>
              <TableHead className="min-w-[80px] font-medium text-foreground bg-muted-foreground/5">
                ステータス
              </TableHead>
              <TableHead className="min-w-[80px] font-medium text-foreground bg-muted-foreground/5">
                更新者
              </TableHead>
              <TableHead className="min-w-[80px] font-medium text-foreground bg-muted-foreground/5">
                更新日
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  物件データがありません
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow
                  key={property.projectPropertyId}
                  className="hover:bg-muted-foreground/10 transition-colors cursor-pointer"
                  onClick={() => {
                    const owner = property.primaryOwner;
                    if (owner && owner.id) {
                      navigator.clipboard.writeText(owner.name);
                      toast.success("所有者名をクリップボードにコピーしました");
                      router.push(`/projects/${projectId}/${owner.id}`);
                    }
                  }}
                >
                  <TableCell className="font-medium text-center">
                    {extractRoomNumber(property.propertyAddress || "")
                      .roomNumber || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2  max-w-[70px] lg:max-w-[90px] xl:max-w-[180px] min-w-[40px]">
                      <span className="truncate break-all">
                        {property.primaryOwner?.name || "-"}
                      </span>
                      {property.ownerCount > 1 && (
                        <Badge variant="outline" className="text-xs">
                          共有
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex">
                      <p className="truncate break-all">
                        {property.primaryOwner?.address || "-"}
                      </p>
                    </div>
                  </TableCell>
                  {/* <TableCell>
                    {property.primaryOwner?.company?.name || "-"}
                  </TableCell> */}
                  <TableCell>
                    {(() => {
                      const owner = property.primaryOwner;
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

                      // 調査ステータスによって表示を切り替え
                      if (owner.investigationStatus === "completed") {
                        return (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20">
                            調査済み
                          </Badge>
                        );
                      }

                      if (owner.investigationStatus === "unknown") {
                        return (
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20">
                            調査したが不明
                          </Badge>
                        );
                      }

                      // 会社情報がある場合は調査中
                      if (owner.companiesCount && owner.companiesCount > 0) {
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
                  <TableCell>
                    {(() => {
                      const ownerUpdate = property.primaryOwner?.updatedAt;
                      const companyUpdate =
                        property.primaryOwner?.company?.updatedAt;

                      // 最新の更新情報を取得
                      if (!ownerUpdate && !companyUpdate) {
                        return <UpdateUser username={null} />;
                      }

                      if (
                        !companyUpdate ||
                        (ownerUpdate &&
                          new Date(ownerUpdate) > new Date(companyUpdate))
                      ) {
                        return (
                          <UpdateUser
                            username={property.primaryOwner?.updatedByUsername}
                          />
                        );
                      }

                      return (
                        <UpdateUser
                          username={
                            property.primaryOwner?.company?.researchedByUsername
                          }
                        />
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const ownerUpdate = property.primaryOwner?.updatedAt;
                      const companyUpdate =
                        property.primaryOwner?.company?.updatedAt;

                      // 最新の更新情報を取得
                      if (!ownerUpdate && !companyUpdate) {
                        return <UpdateDate updatedAt={null} />;
                      }

                      if (
                        !companyUpdate ||
                        (ownerUpdate &&
                          new Date(ownerUpdate) > new Date(companyUpdate))
                      ) {
                        return <UpdateDate updatedAt={ownerUpdate} />;
                      }

                      return <UpdateDate updatedAt={companyUpdate} />;
                    })()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
