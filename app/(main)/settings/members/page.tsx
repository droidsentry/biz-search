import { Metadata } from "next";
import { getBaseURL } from "@/lib/base-url";
import { InviteMemberForm } from './form'
import { MemberList } from './member-list'

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "メンバー管理 - BizSearch",
  description: "BizSearchのチームメンバーを管理します。新しいメンバーの招待、権限の設定、メンバーの削除などを行うことができます。",
};

export default function MembersPage() {
  return (
    <>
        <div className="sm:flex sm:items-center mb-5">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          メンバー管理
          </h1>
          <p className="mt-5 text-sm text-muted-foreground">
          プロジェクトメンバーの管理と新規メンバーの招待
          </p>
        </div>
      </div>

        {/* 招待フォーム */}
        <div className="mt-8">
          <InviteMemberForm />
        </div>

        {/* メンバー一覧 */}
        <div className="mt-12">
          <MemberList />
        </div>
    </>
  )
}