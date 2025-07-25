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
            description: error,
          });
          return;
        }
      );

      if (exportedData) {
        // Excelワークブックを作成
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("物件一覧");

        // ヘッダーを設定
        worksheet.columns = [
          { header: "物件住所", key: "property_address", width: 40 },
          { header: "所有者名", key: "owner_name", width: 20 },
          { header: "所有者住所", key: "owner_address", width: 40 },
          { header: "所有者緯度", key: "owner_lat", width: 15 },
          { header: "所有者経度", key: "owner_lng", width: 15 },
          { header: "候補1_会社名", key: "company_1_name", width: 30 },
          { header: "候補1_法人番号", key: "company_1_number", width: 15 },
          { header: "候補1_役職", key: "company_1_position", width: 15 },
          { header: "候補2_会社名", key: "company_2_name", width: 30 },
          { header: "候補2_法人番号", key: "company_2_number", width: 15 },
          { header: "候補2_役職", key: "company_2_position", width: 15 },
          { header: "候補3_会社名", key: "company_3_name", width: 30 },
          { header: "候補3_法人番号", key: "company_3_number", width: 15 },
          { header: "候補3_役職", key: "company_3_position", width: 15 },
          { header: "所有開始日", key: "ownership_start", width: 15 },
          { header: "インポート日時", key: "import_date", width: 20 },
          { header: "調査日時", key: "researched_date", width: 20 },
        ];

        // データを追加
        exportedData.forEach((row) => {
          worksheet.addRow({
            property_address: row.property_address || "",
            owner_name: row.owner_name || "",
            owner_address: row.owner_address || "",
            owner_lat: row.owner_lat || "",
            owner_lng: row.owner_lng || "",
            company_1_name: row.company_1_name || "",
            company_1_number: row.company_1_number || "",
            company_1_position: row.company_1_position || "",
            company_2_name: row.company_2_name || "",
            company_2_number: row.company_2_number || "",
            company_2_position: row.company_2_position || "",
            company_3_name: row.company_3_name || "",
            company_3_number: row.company_3_number || "",
            company_3_position: row.company_3_position || "",
            ownership_start: row.ownership_start || "",
            import_date: row.import_date || "",
            researched_date: row.researched_date || "",
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
