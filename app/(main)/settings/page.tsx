import { Metadata } from "next";
import { getBaseURL } from "@/lib/base-url";
import { ApiUsage } from './components/api-usage'

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "設定 - BizSearch",
  description: "BizSearchの各種設定を管理します。API使用状況の確認、アカウント設定、通知設定などを行うことができます。",
};

export default function SettingsPage() {
  return (
    <>
      <div className="sm:flex sm:items-center mb-5">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            API使用状況
          </h1>
          <p className="mt-5 text-sm text-muted-foreground">
            API使用状況の確認と料金情報の確認
          </p>
        </div>
      </div>
      <ApiUsage />
    </>
  )
}