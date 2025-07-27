import { SettingsSidebar } from "./components/settings-sidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-2 md:px-4 pb-8">
      <div className="text-gray-1000 border-0 border-b border-solid">
        <h1 className="my-10 text-3xl font-bold">設定</h1>
      </div>
      <div className="relative flex mt-12 w-full">
        {/* 右側の透明サイドバー */}
        <SettingsSidebar />
        {/* メインコンテンツ */}
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
