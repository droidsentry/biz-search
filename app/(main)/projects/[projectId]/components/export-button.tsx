"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportProjectProperties } from "../action";
import { toast } from "sonner";
import ExcelJS from "exceljs";

interface ExportButtonProps {
  projectId: string;
  projectName: string;
}

export function ExportButton({ projectId, projectName }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportedData = await exportProjectProperties(projectId).catch(
        (error) => {
          toast.error("エクスポートエラー", {
            description: error instanceof Error ? error.message : "エクスポートに失敗しました",
          });
          return null;
        }
      );

      if (exportedData) {
        // Excelワークブックを作成
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("物件一覧");

        // ヘッダーを設定
        worksheet.columns = [
          { header: "物件名", key: "property_name", width: 40 },
          { header: "号室", key: "room_number", width: 10 },
          { header: "㎡数", key: "area", width: 10 },
          { header: "所有者名", key: "owner_name", width: 20 },
          { header: "状況", key: "status", width: 15 },
          { header: "自宅番号", key: "home_phone", width: 15 },
          { header: "勤務先", key: "workplace", width: 50 },
          { header: "勤務先番号", key: "workplace_phone", width: 15 },
          { header: "メモ", key: "memo", width: 30 },
          { header: "本人携帯", key: "mobile_phone", width: 15 },
          { header: "所有者住所", key: "owner_address", width: 40 },
          { header: "地番", key: "land_number", width: 20 },
          { header: "参照URL", key: "reference_url", width: 40 },
        ];

        // データを追加
        exportedData.forEach((row) => {
          // 物件住所から号室と地番を抽出
          let roomNumber = "";
          let landNumber = "";
          
          if (row.property_address) {
            // 全角数字を半角に変換する関数
            const toHalfWidth = (str: string) => {
              return str.replace(/[０-９]/g, (s) => {
                return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
              });
            };
            
            // 住所を正規表現でパース（最後の数字部分を探す）
            // パターン1: 「数字-数字」形式（例：１２－３８、12-38）
            // パターン2: 「数字－数字」形式（例：１５－１９－２）
            const patterns = [
              /^(.+?)([０-９\d]+[-－][０-９\d]+(?:[-－][０-９\d]+)*)$/,  // 末尾が「数字-数字」形式
              /^(.+?)([０-９\d]{3,})$/  // 末尾が3桁以上の数字のみ
            ];
            
            let matched = false;
            for (const pattern of patterns) {
              const match = row.property_address.match(pattern);
              if (match) {
                const basePart = match[1];
                const numberPart = match[2];
                
                // 全角数字を半角に変換
                const numberPartHalf = toHalfWidth(numberPart);
                
                // 「-」で始まる場合は取り除く
                const cleanedNumber = numberPartHalf.replace(/^[-－]+/, '');
                
                // 数字とハイフンのみで構成されているか確認
                if (/^[\d-]+$/.test(cleanedNumber)) {
                  // 最後のハイフン以降を号室番号とする
                  const lastDashMatch = cleanedNumber.match(/[-](\d+)$/);
                  if (lastDashMatch && lastDashMatch[1].length >= 1) {
                    roomNumber = lastDashMatch[1];
                    landNumber = basePart + cleanedNumber.substring(0, cleanedNumber.lastIndexOf('-'));
                  } else if (/^\d{3,}$/.test(cleanedNumber)) {
                    // ハイフンがなく3桁以上の数字の場合
                    roomNumber = cleanedNumber;
                    landNumber = basePart.trim();
                  } else {
                    landNumber = row.property_address;
                  }
                  matched = true;
                  break;
                }
              }
            }
            
            if (!matched) {
              // パターンにマッチしない場合は全体を地番とする
              landNumber = row.property_address;
            }
          }

          // 勤務先の情報を整形（①②③形式）
          const workplaces: string[] = [];
          if (row.company_1_name) {
            workplaces.push(`①${row.company_1_name}`);
          }
          if (row.company_2_name) {
            workplaces.push(`②${row.company_2_name}`);
          }
          if (row.company_3_name) {
            workplaces.push(`③${row.company_3_name}`);
          }
          const workplace = workplaces.join(" ");

          // 勤務先番号（①②③形式）
          const workplacePhones: string[] = [];
          if (row.company_1_number) {
            workplacePhones.push(`①${row.company_1_number}`);
          }
          if (row.company_2_number) {
            workplacePhones.push(`②${row.company_2_number}`);
          }
          if (row.company_3_number) {
            workplacePhones.push(`③${row.company_3_number}`);
          }
          const workplacePhone = workplacePhones.join(" ");

          // 状況（空欄にする）
          const status = "";

          // 参照URL（①②③形式）
          const referenceUrls: string[] = [];
          if (row.company_1_source_url) {
            referenceUrls.push(`①${row.company_1_source_url}`);
          }
          if (row.company_2_source_url) {
            referenceUrls.push(`②${row.company_2_source_url}`);
          }
          if (row.company_3_source_url) {
            referenceUrls.push(`③${row.company_3_source_url}`);
          }
          const referenceUrl = referenceUrls.join(" ");

          worksheet.addRow({
            property_name: projectName || "",
            room_number: roomNumber,
            area: "", // 面積情報は現在のデータ構造にないため空
            owner_name: row.owner_name || "",
            status: status,
            home_phone: "", // 自宅番号は現在のデータ構造にないため空
            workplace: workplace,
            workplace_phone: workplacePhone,
            memo: "", // メモは現在のデータ構造にないため空
            mobile_phone: "", // 携帯番号は現在のデータ構造にないため空
            owner_address: row.owner_address || "",
            land_number: landNumber,
            reference_url: referenceUrl,
          });
        });

        // ヘッダーのスタイルを設定
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" },
        };

        // Excelファイルを生成してダウンロード
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `${projectName}_物件一覧_${
            new Date().toISOString().split("T")[0]
          }.xlsx`
        );
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("エクスポート完了", {
          description: "Excelファイルのダウンロードが完了しました",
        });
      }
    } catch (error) {
      console.error("エクスポートエラー:", error);
      toast.error("エクスポートエラー", {
        description: "予期せぬエラーが発生しました",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isExporting ? "エクスポート中..." : "エクスポート"}
    </Button>
  );
}
