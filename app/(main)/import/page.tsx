import { Metadata } from "next";
import { getBaseURL } from "@/lib/base-url";
import { PropertyImportForm } from './components/property-import-form'

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "データインポート - BizSearch",
  description: "CSVやExcelファイルから物件データを一括インポートできます。大量のデータを効率的にBizSearchに取り込むことができます。",
};

export default function PropertyImportPage() {
  return (
    <div className="h-full px-6 py-12">
      <PropertyImportForm />
    </div>
  )
}
