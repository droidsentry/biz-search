"use client";

import { GoogleCustomSearchFormProvider } from "@/components/providers/google-custom-search-form";
import { CompactSearchForm } from "@/app/(main)/search/[patternId]/components/compact-search-form";
import { SearchResults } from "@/app/(main)/search/[patternId]/components/search-results";
import { useGoogleCustomSearchForm } from "@/components/providers/google-custom-search-form";
import { useFormContext } from "react-hook-form";
import { GoogleCustomSearchPattern } from "@/lib/types/custom-search";
import { useEffect } from "react";

interface OwnerSearchProps {
  initialQuery: string;
  initialAddress?: string;
}

function SearchContent({ initialQuery, initialAddress }: OwnerSearchProps) {
  const { data } = useGoogleCustomSearchForm();
  const form = useFormContext<GoogleCustomSearchPattern>();

  // 初期値を設定（初回レンダリング時のみ）
  useEffect(() => {
    // 現在の値を取得
    const currentName = form.getValues("googleCustomSearchParams.customerName");
    const currentAddress = form.getValues("googleCustomSearchParams.address");

    // 初期値が存在し、現在値が空の場合のみ設定
    if (initialQuery && !currentName) {
      form.setValue("googleCustomSearchParams.customerName", initialQuery);
    }
    if (initialAddress && !currentAddress) {
      form.setValue("googleCustomSearchParams.address", initialAddress);
    }
  }, []); // 依存配列を空にして初回のみ実行

  return (
    <div className="space-y-6 w-full">
      <h3 className="text-lg font-semibold">Web検索</h3>

      <div className={data ? "flex gap-4" : "flex justify-center w-full"}>
        {data && (
          <div className="flex-1 sticky top-10">
            <SearchResults />
          </div>
        )}
        <div className="space-y-4 w-[320px] border rounded-lg p-4 sticky top-10 h-fit">
          <CompactSearchForm searchId="new" />
        </div>
      </div>
    </div>
  );
}

export function OwnerSearch({
  initialQuery,
  initialAddress,
}: OwnerSearchProps) {
  return (
    <GoogleCustomSearchFormProvider searchId="new">
      <SearchContent
        initialQuery={initialQuery}
        initialAddress={initialAddress}
      />
    </GoogleCustomSearchFormProvider>
  );
}
