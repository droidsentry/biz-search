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

  // 初期値を設定（初回レンダリング時または initialQuery 変更時）
  useEffect(() => {
    // 現在の値を取得
    const currentName = form.getValues("googleCustomSearchParams.customerName");
    const currentAddress = form.getValues("googleCustomSearchParams.address");

    // initialQueryが変更された場合、または現在値が空の場合に設定
    if (initialQuery && currentName !== initialQuery) {
      form.setValue("googleCustomSearchParams.customerName", initialQuery);
    }
    if (initialAddress) {
      form.setValue("googleCustomSearchParams.address", initialAddress);
    }
  }, [form, initialAddress, initialQuery]);

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
