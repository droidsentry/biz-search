"use client";

import { Button } from "@/components/ui/button";
import { CopyCell } from "@/components/ui/copy-cell";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { batchGeocodeAddresses } from "@/lib/actions/location/batch-geocoding";
import { PropertyData as PropertyDataType } from "@/lib/types/property";
import { cn } from "@/lib/utils";
import {
  Check,
  Database,
  ExternalLink,
  Loader2,
  MapPin,
  MapPinned,
  MapPlus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";
import type { GeocodingResult, ParseResult, PropertyData } from "../types";
import { NavigationConfirmDialog } from "./navigation-confirm-dialog";
import { SavePropertiesDialog } from "./save-properties-dialog";

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

  // 編集されたデータの状態管理
  const [editedData, setEditedData] = useState<Map<string, PropertyData>>(
    new Map()
  );

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

  // フラットな行データを作成
  interface TableRow {
    fileName: string;
    fileSize: number;
    status: "success" | "error";
    property: PropertyData | null;
    error?: string;
    originalIndex: number; // 元のresults配列のインデックス
    rowKey: string; // ジオコーディング結果のキー
    isSuspiciousFile?: boolean; // 不正なファイルか
    suspiciousReason?: string; // 不正な理由
  }

  // 編集された名前を取得する関数
  const getEditedProperty = (row: TableRow): PropertyData | null => {
    if (!row.property) return null;
    const edited = editedData.get(row.rowKey);
    return edited || row.property;
  };

  // 名前を編集する関数
  const handleNameEdit = (rowKey: string, newName: string) => {
    const row = tableRows.find((r) => r.rowKey === rowKey);
    if (!row || !row.property) return;

    const newEditedData = new Map(editedData);
    newEditedData.set(rowKey, {
      ...row.property,
      ownerName: newName,
    });
    setEditedData(newEditedData);
  };

  // 住所を編集する関数
  const handleAddressEdit = (rowKey: string, newAddress: string) => {
    const row = tableRows.find((r) => r.rowKey === rowKey);
    if (!row || !row.property) return;

    const newEditedData = new Map(editedData);
    const currentData = editedData.get(rowKey) || row.property;
    newEditedData.set(rowKey, {
      ...currentData,
      ownerAddress: newAddress,
    });
    setEditedData(newEditedData);
  };

  // デバッグ：不正ファイルの検出状況を確認
  // const suspiciousFiles = results.filter((r) => r.isSuspiciousFile);
  // if (suspiciousFiles.length > 0) {
  //   console.log("🚨 結果テーブルで不正ファイル検出:", suspiciousFiles);
  // }

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
          isSuspiciousFile: result.isSuspiciousFile,
          suspiciousReason: result.suspiciousReason,
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
          isSuspiciousFile: result.isSuspiciousFile,
          suspiciousReason: result.suspiciousReason,
        },
      ];
    }
  });

  // const handleShowDetails = (row: TableRow) => {
  //   const geocoding = geocodingResults.get(row.rowKey);

  //   if (row.property) {
  //     const property = getEditedProperty(row)!;
  //     toast.info(
  //       <div className="space-y-2 w-fit">
  //         {/* デバッグ用 削除しないでください*/}
  //         <pre className="text-muted-foreground bg-muted p-2 border rounded-md text-xs break-all whitespace-pre-wrap">
  //           {JSON.stringify(property, null, 2)}
  //         </pre>
  //         <pre className="text-muted-foreground bg-muted p-2 border rounded-md text-xs break-all whitespace-pre-wrap">
  //           {JSON.stringify(geocoding, null, 2)}
  //         </pre>
  //         <div className="text-muted-foreground bg-muted p-2 border rounded-md">
  //           <p>物件住所: {property.propertyAddress}</p>
  //           <p>所有者名: {property.ownerName}</p>
  //           <p>所有者住所: {property.ownerAddress}</p>

  //           {geocoding && (
  //             <>
  //               <div className="mt-2 pt-2 border-t border-muted-foreground/20">
  //                 <p className="font-semibold mb-1">位置情報:</p>
  //                 {geocoding.lat && geocoding.lng ? (
  //                   <>
  //                     <p>緯度: {geocoding.lat}</p>
  //                     <p>経度: {geocoding.lng}</p>
  //                     <p>
  //                       ストリートビュー:{" "}
  //                       {geocoding.streetViewAvailable
  //                         ? "利用可能"
  //                         : "利用不可"}
  //                     </p>
  //                   </>
  //                 ) : geocoding.error ? (
  //                   <p className="text-red-500">エラー: {geocoding.error}</p>
  //                 ) : (
  //                   <p className="text-zinc-500">未取得</p>
  //                 )}
  //               </div>
  //             </>
  //           )}
  //         </div>
  //       </div>,
  //       {
  //         duration: 5000,
  //         position: "top-center",
  //         style: {
  //           maxWidth: "1500px",
  //           width: "auto",
  //         },
  //       }
  //     );
  //   } else {
  //     toast.error(`エラー: ${row.error || "情報がありません"}`, {
  //       position: "top-center",
  //     });
  //   }
  // };

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
      // console.log(`batchResults`, batchResults);

      // 結果を状態に反映
      const newResults = new Map(geocodingResults);
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      batchResults.forEach((result, index) => {
        const row = validRows[index];
        if (result.success && result.data) {
          newResults.set(row.rowKey, {
            lat: result.data.lat,
            lng: result.data.lng,
            formattedAddress: result.data.formattedAddress,
            streetViewAvailable: result.streetViewAvailable,
          });
          successCount++;
        } else {
          const errorMessage = result.error || "位置情報を取得できませんでした";
          newResults.set(row.rowKey, {
            error: errorMessage,
          });
          errorCount++;

          // API制限エラーのチェック
          if (
            errorMessage.includes("API利用制限に達しました") ||
            errorMessage.includes("API制限に達しました")
          ) {
            if (errors.length === 0) {
              // 最初のAPI制限エラーのみを詳細に記録
              errors.push(errorMessage);
            }
          } else if (errors.length < 5) {
            // その他のエラーは最大5件まで記録
            errors.push(`${row.property!.ownerAddress}: ${errorMessage}`);
          }
        }

        // 進捗更新
        setGeocodingProgress({ current: index + 1, total: validRows.length });
      });

      setGeocodingResults(newResults);

      // 結果に応じてトースト表示
      if (successCount > 0 && errorCount === 0) {
        toast.success(`${successCount}件の位置情報を取得しました`);
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(
          `${successCount}件の位置情報を取得、${errorCount}件失敗しました`
        );

        // エラー詳細を表示
        if (errors.length > 0) {
          const errorMessage = errors.join("\n");
          toast.error(
            <div className="space-y-1">
              <p className="font-medium">位置情報取得エラー:</p>
              <pre className="text-xs whitespace-pre-wrap">{errorMessage}</pre>
            </div>,
            {
              duration: 10000,
            }
          );
        }
      } else if (errorCount > 0) {
        toast.error(`すべての位置情報取得に失敗しました（${errorCount}件）`);

        // エラー詳細を表示
        if (errors.length > 0) {
          const errorMessage = errors.join("\n");
          toast.error(
            <div className="space-y-1">
              <p className="font-medium">位置情報取得エラー:</p>
              <pre className="text-xs whitespace-pre-wrap">{errorMessage}</pre>
            </div>,
            {
              duration: 10000,
            }
          );
        }
      }
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

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // 不正なファイルがあるかチェック
                      const hasSuspiciousFiles = tableRows.some(
                        (row) => row.isSuspiciousFile
                      );
                      if (hasSuspiciousFiles) {
                        const suspiciousFileNames = [
                          ...new Set(
                            tableRows
                              .filter((row) => row.isSuspiciousFile)
                              .map((row) => row.fileName)
                          ),
                        ];
                        toast.error(
                          `不正なファイルが含まれています。\n${suspiciousFileNames.join(
                            "、"
                          )}\n\n該当ファイルを削除してから保存してください。`,
                          {
                            duration: 5000,
                          }
                        );
                        return;
                      }

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
                        (row) =>
                          row.property && !geocodingResults.get(row.rowKey)?.lat
                      );

                      if (propertiesWithoutLocation.length > 0) {
                        const confirmMessage = `${propertiesWithoutLocation.length}件の物件で位置情報が取得されていません。\n位置情報なしで保存しますか？\n\n位置情報がない場合、地図表示やストリートビューが利用できません。`;

                        if (!window.confirm(confirmMessage)) {
                          return;
                        }
                      }

                      setSaveDialogOpen(true);
                    }}
                    disabled={
                      totalProperties === 0 ||
                      tableRows.some((row) => row.isSuspiciousFile)
                    }
                    className="text-zinc-400 hover:text-white border-zinc-700"
                  >
                    <Database className="mr-2 size-4" />
                    データベースに保存
                  </Button>
                </span>
              </TooltipTrigger>
              {tableRows.some((row) => row.isSuspiciousFile) && (
                <TooltipContent>
                  <p>不正なファイルを削除してから保存してください</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

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
              className={cn(
                "rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3",
                row.isSuspiciousFile && "border-red-800 bg-red-900/20"
              )}
            >
              {row.isSuspiciousFile && row.suspiciousReason && (
                <div className="rounded-md bg-red-800/30 p-3 mb-3">
                  <p className="text-red-400 text-sm">
                    ⚠️ 不正なファイルの可能性: {row.suspiciousReason}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <h3
                  className={cn(
                    "font-medium text-white text-sm truncate flex-1 mr-4",
                    row.isSuspiciousFile && "text-red-400"
                  )}
                >
                  {row.fileName}
                </h3>
                <div className="flex items-center gap-2">
                  {row.status === "success" ? (
                    <Check className="size-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <X className="size-5 text-red-500 flex-shrink-0" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(row.originalIndex)}
                    className="h-8 w-8 p-0 hover:bg-red-900/30 hover:text-red-400"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">サイズ</span>
                  <span
                    className={cn(
                      "text-zinc-300",
                      row.isSuspiciousFile && "text-red-400"
                    )}
                  >
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
                          className={cn(
                            "text-white font-medium",
                            row.isSuspiciousFile && "text-red-400"
                          )}
                          truncate={false}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-zinc-500">所有者名</span>
                      <div className="-mx-4 px-4">
                        <Input
                          value={getEditedProperty(row)?.ownerName || ""}
                          onChange={(e) =>
                            handleNameEdit(row.rowKey, e.target.value)
                          }
                          className={`bg-zinc-800 border-zinc-700 ${
                            row.property.isOwnerNameCorrupted
                              ? "text-red-400"
                              : "text-zinc-300"
                          }`}
                          placeholder="所有者名を入力"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-zinc-500">所有者住所</span>
                      <div className="-mx-4 px-4">
                        <Input
                          value={getEditedProperty(row)?.ownerAddress || ""}
                          onChange={(e) =>
                            handleAddressEdit(row.rowKey, e.target.value)
                          }
                          className={`bg-zinc-800 border-zinc-700 ${
                            row.property.isOwnerAddressCorrupted
                              ? "text-red-400"
                              : "text-zinc-300"
                          }`}
                          placeholder="所有者住所を入力"
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
              <TableHead className="text-foreground/80 font-semibold w-20">
                ファイル名
              </TableHead>
              <TableHead className="text-foreground/80 font-semibold text-center w-12">
                状態
              </TableHead>
              <TableHead className="text-foreground/80 font-semibold text-right w-18">
                サイズ
              </TableHead>
              <TableHead className="text-foreground/80 font-semibold w-20">
                物件住所
              </TableHead>
              <TableHead className="text-foreground/80 font-semibold w-80">
                所有者名
              </TableHead>
              <TableHead className="text-foreground/80 font-semibold">
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
                <React.Fragment key={index}>
                  <TableRow
                    className={cn(
                      "border-muted-foreground/20 hover:bg-muted-foreground/10",
                      row.isSuspiciousFile && "bg-red-900/20"
                    )}
                  >
                    <TableCell
                      className={cn(
                        "font-medium text-foreground w-32 p-0",
                        row.isSuspiciousFile && "text-red-500"
                      )}
                    >
                      <CopyCell value={row.fileName} truncate={true} />
                    </TableCell>
                    <TableCell className="text-center">
                      {row.status === "success" ? (
                        <Check className="size-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="size-4 text-destructive mx-auto" />
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right text-muted-foreground",
                        row.isSuspiciousFile && "text-red-400"
                      )}
                    >
                      {formatFileSize(row.fileSize)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-foreground/80 w-40 p-0",
                        row.isSuspiciousFile && "text-red-400"
                      )}
                    >
                      {row.property ? (
                        <CopyCell
                          value={row.property.propertyAddress}
                          truncate={true}
                        />
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
                        <div className="px-2 py-1">
                          <Input
                            value={getEditedProperty(row)?.ownerName || ""}
                            onChange={(e) =>
                              handleNameEdit(row.rowKey, e.target.value)
                            }
                            className={`h-8 text-sm bg-muted/30 border-muted-foreground/20 ${
                              row.property.isOwnerNameCorrupted
                                ? "text-red-400"
                                : ""
                            }`}
                            placeholder="所有者名を入力"
                          />
                        </div>
                      ) : (
                        <span className="block truncate px-2 py-1">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground/80 p-0">
                      {row.property ? (
                        <div className="px-2 py-1">
                          <Input
                            value={getEditedProperty(row)?.ownerAddress || ""}
                            onChange={(e) =>
                              handleAddressEdit(row.rowKey, e.target.value)
                            }
                            className={`h-8 text-sm bg-muted/30 border-muted-foreground/20 ${
                              row.property.isOwnerAddressCorrupted
                                ? "text-red-400"
                                : ""
                            }`}
                            placeholder="所有者住所を入力"
                          />
                        </div>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(row.originalIndex)}
                        className="h-8 w-8 p-0 hover:bg-red-900/30 hover:text-red-400"
                        title="削除"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {row.isSuspiciousFile && row.suspiciousReason && (
                    <TableRow
                      key={`${index}-warning`}
                      className="bg-red-900/20 hover:bg-red-900/30"
                    >
                      <TableCell
                        colSpan={9}
                        className="text-red-400 text-sm py-2"
                      >
                        ⚠️ 不正なファイルの可能性: {row.suspiciousReason}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
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
            const property = getEditedProperty(row)!;
            return {
              propertyAddress: property.propertyAddress,
              ownerName: property.ownerName,
              ownerAddress: property.ownerAddress,
              lat: geocoding?.lat || null,
              lng: geocoding?.lng || null,
              streetViewAvailable: geocoding?.streetViewAvailable || false,
              sourceFileName: row.fileName,
            } as PropertyDataType;
          })}
        onSaveComplete={(response) => {
          if (response.success) {
            // 保存成功後の処理
            // console.log("保存完了:", response);
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
