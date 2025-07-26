"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  Eye,
  Loader2,
  MapPin,
  MapPinned,
  MapPlus,
  MoreHorizontal,
  MoreVertical,
  RefreshCw,
  Trash2,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import type { ParseResult, PropertyData, GeocodingResult } from "../types";
import { batchGeocodeAddresses } from "@/lib/actions/location/batch-geocoding";
import Link from "next/link";
import { CopyCell } from "@/components/ui/copy-cell";
import { SavePropertiesDialog } from "./save-properties-dialog";
import { NavigationConfirmDialog } from "./navigation-confirm-dialog";
import { PropertyData as PropertyDataType } from "@/lib/types/property";
import { Database } from "lucide-react";

interface ResultsTableProps {
  results: ParseResult[];
  onReset: () => void;
  onDelete?: (index: number) => void;
}

export function ResultsTable({
  results,
  onReset,
  onDelete,
}: ResultsTableProps) {
  const successCount = results.filter((r) => r.status === "success").length;
  const totalProperties = results.reduce(
    (sum, r) => sum + (r.propertyData?.length || 0),
    0
  );

  // ジオコーディング結果の状態管理
  const [geocodingResults, setGeocodingResults] = useState<
    Map<string, GeocodingResult>
  >(new Map());
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // 保存ダイアログの状態管理
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // 遷移確認ダイアログの状態管理
  const [navigationDialogOpen, setNavigationDialogOpen] = useState(false);
  const [savedProjectInfo, setSavedProjectInfo] = useState<{
    savedCount: number;
    projectName?: string;
  }>({ savedCount: 0 });

  // URL生成関数
  const generateMapsUrl = (lat: number, lng: number) => {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  const generateStreetViewUrl = (lat: number, lng: number) => {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // const formatDate = (dateString: string): string => {
  //   const date = new Date(dateString)
  //   return date.toLocaleDateString('ja-JP', {
  //     year: 'numeric',
  //     month: '2-digit',
  //     day: '2-digit',
  //     hour: '2-digit',
  //     minute: '2-digit'
  //   })
  // }

  // フラットな行データを作成
  interface TableRow {
    fileName: string;
    fileSize: number;
    status: "success" | "error";
    property: PropertyData | null;
    error?: string;
    originalIndex: number; // 元のresults配列のインデックス
    rowKey: string; // ジオコーディング結果のキー
  }

  const tableRows: TableRow[] = results.flatMap((result, index): TableRow[] => {
    if (result.propertyData && result.propertyData.length > 0) {
      return result.propertyData.map(
        (property, propIndex): TableRow => ({
          fileName: result.fileName,
          fileSize: result.fileSize,
          status: result.status,
          property,
          error: undefined,
          originalIndex: index,
          rowKey: `${index}-${propIndex}`,
        })
      );
    } else {
      return [
        {
          fileName: result.fileName,
          fileSize: result.fileSize,
          status: result.status,
          property: null,
          error: result.error,
          originalIndex: index,
          rowKey: `${index}-0`,
        },
      ];
    }
  });

  const handleShowDetails = (row: TableRow) => {
    const geocoding = geocodingResults.get(row.rowKey);

    if (row.property) {
      toast.info(
        <div className="space-y-2 w-fit">
          {/* デバッグ用 削除しないでください*/}
          <pre className="text-muted-foreground bg-muted p-2 border rounded-md text-xs break-all whitespace-pre-wrap">
            {JSON.stringify(row.property, null, 2)}
          </pre>
          <pre className="text-muted-foreground bg-muted p-2 border rounded-md text-xs break-all whitespace-pre-wrap">
            {JSON.stringify(geocoding, null, 2)}
          </pre>
          <div className="text-muted-foreground bg-muted p-2 border rounded-md">
            <p>物件住所: {row.property.propertyAddress}</p>
            <p>所有者名: {row.property.ownerName}</p>
            <p>所有者住所: {row.property.ownerAddress}</p>

            {geocoding && (
              <>
                <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                  <p className="font-semibold mb-1">位置情報:</p>
                  {geocoding.lat && geocoding.lng ? (
                    <>
                      <p>緯度: {geocoding.lat}</p>
                      <p>経度: {geocoding.lng}</p>
                      <p>
                        ストリートビュー:{" "}
                        {geocoding.streetViewAvailable
                          ? "利用可能"
                          : "利用不可"}
                      </p>
                    </>
                  ) : geocoding.error ? (
                    <p className="text-red-500">エラー: {geocoding.error}</p>
                  ) : (
                    <p className="text-zinc-500">未取得</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>,
        {
          duration: 5000,
          position: "top-center",
          style: {
            maxWidth: "1500px",
            width: "auto",
          },
        }
      );
    } else {
      toast.error(`エラー: ${row.error || "情報がありません"}`, {
        position: "top-center",
      });
    }
  };

  const handleDelete = (originalIndex: number) => {
    if (onDelete) {
      onDelete(originalIndex);
      toast.success("削除しました");
    }
  };

  // ジオコーディング一括処理
  const handleBatchGeocode = async () => {
    // 有効な物件データを持つ行のみを対象
    const validRows = tableRows.filter(
      (row) => row.property && row.property.ownerAddress
    );

    if (validRows.length === 0) {
      toast.error("ジオコーディング可能な物件がありません");
      return;
    }

    setIsGeocoding(true);
    setGeocodingProgress({ current: 0, total: validRows.length });

    try {
      const ownerAddresses = validRows.map((row) => row.property!.ownerAddress);
      const batchResults = await batchGeocodeAddresses(ownerAddresses);
      console.log(`batchResults`, batchResults);

      // 結果を状態に反映
      const newResults = new Map(geocodingResults);
      batchResults.forEach((result, index) => {
        const row = validRows[index];
        if (result.success && result.data) {
          newResults.set(row.rowKey, {
            lat: result.data.lat,
            lng: result.data.lng,
            formattedAddress: result.data.formattedAddress,
            streetViewAvailable: result.streetViewAvailable,
          });
        } else {
          newResults.set(row.rowKey, {
            error: result.error || "位置情報を取得できませんでした",
          });
        }

        // 進捗更新
        setGeocodingProgress({ current: index + 1, total: validRows.length });
      });

      setGeocodingResults(newResults);
      toast.success(
        `${
          batchResults.filter((r) => r.success).length
        }件の位置情報を取得しました`
      );
    } catch (error) {
      console.error("バッチジオコーディングエラー:", error);
      toast.error("位置情報の取得中にエラーが発生しました");
    } finally {
      setIsGeocoding(false);
      setGeocodingProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">解析結果</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {successCount}/{results.length}件のPDFを解析 • {totalProperties}
            件の物件情報を抽出
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBatchGeocode}
            disabled={isGeocoding || totalProperties === 0}
            className="text-zinc-400 hover:text-white border-zinc-700"
          >
            {isGeocoding ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {geocodingProgress
                  ? `${geocodingProgress.current}/${geocodingProgress.total}件処理中`
                  : "処理中..."}
              </>
            ) : (
              <>
                <MapPin className="mr-2 size-4" />
                位置情報を一括取得
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // 所有者住所が取得できない物件をチェック
              const propertiesWithoutOwnerAddress = tableRows.filter(
                (row) => row.property && !row.property.ownerAddress
              );

              if (propertiesWithoutOwnerAddress.length > 0) {
                toast.error(
                  `${propertiesWithoutOwnerAddress.length}件の物件で所有者住所が取得できていません。\nPDFから所有者住所が正しく読み取れていない可能性があります。\n\n所有者住所がない物件は保存できません。`,
                  {
                    duration: 5000,
                  }
                );
                return;
              }

              // 位置情報が取得されていない物件をチェック
              const propertiesWithoutLocation = tableRows.filter(
                (row) => row.property && !geocodingResults.get(row.rowKey)?.lat
              );

              if (propertiesWithoutLocation.length > 0) {
                const confirmMessage = `${propertiesWithoutLocation.length}件の物件で位置情報が取得されていません。\n位置情報なしで保存しますか？\n\n位置情報がない場合、地図表示やストリートビューが利用できません。`;

                if (!window.confirm(confirmMessage)) {
                  return;
                }
              }

              setSaveDialogOpen(true);
            }}
            disabled={totalProperties === 0}
            className="text-zinc-400 hover:text-white border-zinc-700"
          >
            <Database className="mr-2 size-4" />
            データベースに保存
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-zinc-400 hover:text-white"
          >
            <RefreshCw className="mr-2 size-4" />
            リセット
          </Button>
        </div>
      </div>

      {/* モバイル表示 */}
      <div className="block md:hidden space-y-4">
        {tableRows.map((row, index) => {
          const geocoding = geocodingResults.get(row.rowKey);

          return (
            <div
              key={index}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white text-sm truncate flex-1 mr-4">
                  {row.fileName}
                </h3>
                <div className="flex items-center gap-2">
                  {row.status === "success" ? (
                    <Check className="size-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <X className="size-5 text-red-500 flex-shrink-0" />
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleShowDetails(row)}>
                        <Eye className="mr-2 size-4" />
                        詳細を表示
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(row.originalIndex)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 size-4" />
                        削除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">サイズ</span>
                  <span className="text-zinc-300">
                    {formatFileSize(row.fileSize)}
                  </span>
                </div>

                {row.property && (
                  <>
                    <div className="space-y-1">
                      <span className="text-zinc-500">物件住所</span>
                      <div className="-mx-4">
                        <CopyCell
                          value={row.property.propertyAddress}
                          className="text-white font-medium"
                          truncate={false}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-zinc-500">所有者名</span>
                      <div className="-mx-4">
                        <CopyCell
                          value={row.property.ownerName}
                          className="text-zinc-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-zinc-500">所有者住所</span>
                      <div className="-mx-4">
                        <CopyCell
                          value={row.property.ownerAddress}
                          className="text-zinc-300"
                          truncate={false}
                        />
                      </div>
                    </div>

                    {geocoding && (
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">地図:</span>
                          {geocoding.loading ? (
                            <Loader2 className="size-4 animate-spin text-zinc-400" />
                          ) : geocoding.lat && geocoding.lng ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() =>
                                window.open(
                                  generateMapsUrl(
                                    geocoding.lat!,
                                    geocoding.lng!
                                  ),
                                  "_blank"
                                )
                              }
                            >
                              <ExternalLink className="size-3 mr-1" />
                              開く
                            </Button>
                          ) : geocoding.error ? (
                            <X className="size-4 text-red-500" />
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">
                            ストリートビュー:
                          </span>
                          {geocoding.streetViewAvailable === true &&
                          geocoding.lat &&
                          geocoding.lng ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => {
                                window.open(
                                  generateStreetViewUrl(
                                    geocoding.lat!,
                                    geocoding.lng!
                                  ),
                                  "_blank"
                                );
                              }}
                            >
                              <ExternalLink className="size-3 mr-1" />
                              開く
                            </Button>
                          ) : geocoding.streetViewAvailable === false ? (
                            <X className="size-4 text-zinc-500" />
                          ) : (
                            <span className="text-zinc-500">-</span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {row.error && (
                  <div className="space-y-1">
                    <span className="text-zinc-500">エラー</span>
                    <p className="text-red-400">{row.error}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* デスクトップ表示 */}
      <div className="hidden md:block rounded-lg border border-muted-foreground/20 bg-muted-foreground/5 overflow-x-auto">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-muted-foreground/5 hover:bg-muted-foreground/10">
              <TableHead className="text-foreground/80 font-semibold min-w-[200px]">
                ファイル名
              </TableHead>
              <TableHead className="text-foreground/80 font-semibold text-center w-12">
                状態
              </TableHead>
              <TableHead className="text-foreground/80 font-semibold text-right w-18">
                サイズ
              </TableHead>
              <TableHead className="text-foreground/80 font-semibold w-60">
                物件住所
              </TableHead>
              <TableHead className="text-foreground/80 font-semibold w-25">
                所有者名
              </TableHead>
              <TableHead className="text-foreground/80 font-semibold w-60">
                所有者住所
              </TableHead>
              <TableHead className="text-foreground/80 font-semibold text-center w-12">
                <div className="flex items-center justify-center gap-1">
                  <MapPinned className="size-4" aria-label="地図" />
                </div>
              </TableHead>
              <TableHead className="text-foreground/80 font-semibold text-center w-12">
                <div className="flex items-center justify-center gap-1">
                  <MapPlus className="size-4" aria-label="ストリートビュー" />
                </div>
              </TableHead>
              <TableHead className="text-foreground/80 font-semibold w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((row, index) => {
              const geocoding = geocodingResults.get(row.rowKey);

              return (
                <TableRow
                  key={index}
                  className="border-muted-foreground/20 hover:bg-muted-foreground/10"
                >
                  <TableCell className="font-medium text-foreground min-w-[200px] truncate">
                    <span className="block truncate" title={row.fileName}>
                      {row.fileName}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {row.status === "success" ? (
                      <Check className="size-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="size-4 text-destructive mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatFileSize(row.fileSize)}
                  </TableCell>
                  <TableCell className="text-foreground/80 p-0">
                    {row.property ? (
                      <CopyCell value={row.property.propertyAddress} />
                    ) : (
                      <span
                        className="block truncate px-2 py-1"
                        title={row.error || "エラー"}
                      >
                        {row.error || "エラー"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground/80 p-0">
                    {row.property ? (
                      <CopyCell value={row.property.ownerName} />
                    ) : (
                      <span className="block truncate px-2 py-1">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground/80 p-0">
                    {row.property ? (
                      <CopyCell value={row.property.ownerAddress} />
                    ) : (
                      <span className="block truncate px-2 py-1">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.property &&
                      (geocoding?.loading ? (
                        <Loader2 className="size-4 animate-spin mx-auto text-zinc-400" />
                      ) : geocoding && geocoding.lat && geocoding.lng ? (
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={generateMapsUrl(
                              geocoding.lat!,
                              geocoding.lng!
                            )}
                            target="_blank"
                          >
                            <ExternalLink />
                          </Link>
                        </Button>
                      ) : geocoding?.error ? (
                        <X className="size-4 text-red-500 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      ))}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.property &&
                      geocoding &&
                      (geocoding.streetViewAvailable === true &&
                      geocoding.lat &&
                      geocoding.lng ? (
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={generateStreetViewUrl(
                              geocoding.lat!,
                              geocoding.lng!
                            )}
                            target="_blank"
                          >
                            <ExternalLink />
                          </Link>
                        </Button>
                      ) : geocoding.streetViewAvailable === false ? (
                        <X className="size-4 text-zinc-500 mx-auto" />
                      ) : (
                        <span className="text-zinc-500">-</span>
                      ))}
                  </TableCell>
                  <TableCell className="w-12">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleShowDetails(row)}
                        >
                          <Eye className="mr-2 size-4" />
                          詳細を表示
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(row.originalIndex)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 size-4" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 保存ダイアログ */}
      <SavePropertiesDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        properties={tableRows
          .filter((row) => row.property !== null)
          .map((row) => {
            const geocoding = geocodingResults.get(row.rowKey);
            return {
              propertyAddress: row.property!.propertyAddress,
              ownerName: row.property!.ownerName,
              ownerAddress: row.property!.ownerAddress,
              lat: geocoding?.lat || null,
              lng: geocoding?.lng || null,
              streetViewAvailable: geocoding?.streetViewAvailable || false,
              sourceFileName: row.fileName,
            } as PropertyDataType;
          })}
        onSaveComplete={(response) => {
          if (response.success) {
            // 保存成功後の処理
            console.log("保存完了:", response);
            setSavedProjectInfo({
              savedCount: response.savedCount,
              projectName: response.projectName,
            });
            setNavigationDialogOpen(true);
          }
        }}
      />

      {/* 遷移確認ダイアログ */}
      <NavigationConfirmDialog
        open={navigationDialogOpen}
        onOpenChange={setNavigationDialogOpen}
        savedCount={savedProjectInfo.savedCount}
        projectName={savedProjectInfo.projectName}
      />
    </div>
  );
}
