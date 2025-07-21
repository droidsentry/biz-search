import GoogleCustomSearchForm from './components/form'
import { SearchResults } from './components/search-results';

export default async function Page(
  
  {
  params,
}: {
  params: Promise<{ searchId: string }>;
}

) {
  const { searchId } = await params;
  console.log("searchId", searchId);

  return (
    <div className="mx-auto max-w-7xl px-2 md:px-4">
    <div className="border-0 border-b border-solid flex items-center justify-between relative">
        <h1 className="my-10 text-3xl font-bold">カスタム検索</h1>
    </div>
    <div className="flex flex-col md:flex-row justify-center mt-10 gap-10">
      <SearchResults/>
      <GoogleCustomSearchForm />
    </div>
    </div>
  )
}
