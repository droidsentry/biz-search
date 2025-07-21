import { ApiUsage } from './components/api-usage'

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