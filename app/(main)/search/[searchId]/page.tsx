import GoogleCustomSearchForm from './components/form'

export default async function Page({
  params,
}: {
  params: Promise<{ searchId: string }>;
}) {
  const { searchId } = await params;

  return (
    <div className="mx-auto max-w-[1400px] px-2 md:px-4">
      <div className="border-0 border-b border-solid flex items-center justify-between">
        <h1 className="my-10 text-3xl font-bold">カスタム検索</h1>
      </div>
      <GoogleCustomSearchForm searchId={searchId} />
    </div>
  )
}
