"use client";

import { useGoogleCustomSearchOwnerForm } from "@/components/providers/google-custom-search-owner-form";
import { Separator } from "@/components/ui/separator";
import { GoogleCustomSearchPattern } from "@/lib/types/custom-search";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { PatternCards } from "./pattern-cards";
import { SearchForm } from "./search-form";
import { SearchResults } from "./search-results";
import { SearchSidebar } from "./search-sidebar";

interface OwnerSearchProps {
  initialQuery: string;
  initialAddress?: string;
}

function SearchContent({ initialQuery, initialAddress }: OwnerSearchProps) {
  const { data, patterns, googleCustomSearchPattern } =
    useGoogleCustomSearchOwnerForm();
  const form = useFormContext<GoogleCustomSearchPattern>();

  // ownerIdの変更を追跡して初期値を設定
  const { currentOwnerId } = useGoogleCustomSearchOwnerForm();
  
  useEffect(() => {
    // ownerIdが変更された時に初期値を設定
    if (currentOwnerId && initialQuery) {
      form.setValue("googleCustomSearchParams.customerName", initialQuery);
    }
    if (currentOwnerId && initialAddress) {
      form.setValue("googleCustomSearchParams.address", initialAddress);
    }
  }, [currentOwnerId]); // ownerIdが変更された時のみ実行

  return (
    <div className="space-y-6 w-full">
      <h3 className="text-lg font-semibold">Web検索</h3>

      <div
        className={
          data && googleCustomSearchPattern
            ? "flex gap-4"
            : "flex justify-center w-full"
        }
      >
        {data && googleCustomSearchPattern && (
          <div className="flex-1 sticky top-10">
            <SearchResults />
          </div>
        )}
        {/* サイドバー */}
        <SearchSidebar className={cn("z-40")}>
          {/* <div className="space-y-4 w-[320px] border rounded-lg p-4 sticky top-10 h-fit"> */}
          <div className="space-y-4 ">
            <SearchForm />

            <Separator />

            {/* 保存されたパターン */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">保存された検索パターン</h3>
              </div>
              <PatternCards patterns={patterns} />
            </div>
          </div>
        </SearchSidebar>
      </div>
    </div>
  );
}

export function OwnerSearch({
  initialQuery,
  initialAddress,
}: OwnerSearchProps) {
  return (
    // <GoogleCustomSearchFormProvider
    //   patterns={[]}
    //   selectedSearchPattern={undefined}
    // >
    <SearchContent
      initialQuery={initialQuery}
      initialAddress={initialAddress}
    />
    // </GoogleCustomSearchFormProvider>
  );
}
