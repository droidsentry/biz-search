"use client";

import { DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN } from "@/lib/constants/google-custom-search";
import { googleCustomSearchPatternSchema } from "@/lib/schemas/custom-search";
import { useGoogleCustomSearch } from "@/lib/swr/google-custom-search";
import {
  GoogleCustomSearchPattern,
  GoogleSearchRequestResponse,
  SearchPattern,
} from "@/lib/types/custom-search";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { Form } from "../ui/form";

type ContextType = {
  patternId: string;
  isNewSearch: boolean;
  mode: "sidebar" | "full";
  googleCustomSearchPattern: GoogleCustomSearchPattern | undefined;
  handleSearch: (formData: GoogleCustomSearchPattern) => void;
  data: GoogleSearchRequestResponse | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | undefined;
};

const Context = createContext<ContextType>({} as ContextType);

export function GoogleCustomSearchFormProvider({
  children,
  selectedSearchPattern,
}: {
  children: ReactNode;
  selectedSearchPattern?: SearchPattern;
}) {
  const patternId = selectedSearchPattern?.id || "new";
  const isNewSearch = patternId === "new";
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"sidebar" | "full">("full");
  const [googleCustomSearchPattern, setGoogleCustomSearchPattern] =
    useState<GoogleCustomSearchPattern>();

  const defaultValues = isNewSearch
    ? DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN
    : {
        ...DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN,
        patternId: isNewSearch ? undefined : patternId,
      };

  // searchIdが変更されても、明示的に更新されるまでは古い値を保持
  const form = useForm<GoogleCustomSearchPattern>({
    resolver: zodResolver(googleCustomSearchPatternSchema),
    mode: "onChange",
    defaultValues,
  });

  const handleSearch = async (formData: GoogleCustomSearchPattern) => {
    setGoogleCustomSearchPattern(formData);
  };

  const { data, isLoading, isValidating, error } = useGoogleCustomSearch({
    formData: googleCustomSearchPattern,
  });

  const currentFormValues = form.getValues();
  useEffect(() => {
    if (data) {
      setMode("sidebar");
    } else {
      setMode("full");
    }
    const page = searchParams.get("start");
    if (page) {
      currentFormValues.googleCustomSearchParams.startPage = parseInt(page);
      setGoogleCustomSearchPattern(currentFormValues);
    }
    const patternId = searchParams.get("patternId");
    if (patternId && patternId !== "new") {
      if (selectedSearchPattern) {
        // 現在のフォームの値を取得
        // パターンのparamsをパース
        const savedParams = selectedSearchPattern.googleCustomSearchParams;
        // フォームにデータを設定（customerNameとaddressは現在の値を維持）
        const formData: GoogleCustomSearchPattern = {
          id: selectedSearchPattern.id,
          searchPatternName: selectedSearchPattern.searchPatternName,
          searchPatternDescription:
            selectedSearchPattern.searchPatternDescription || undefined,
          googleCustomSearchParams: {
            // 現在のフォームの顧客名と住所を維持
            customerName:
              currentFormValues.googleCustomSearchParams.customerName,
            address: currentFormValues.googleCustomSearchParams.address,
            // その他の設定はパターンから読み込む
            customerNameExactMatch:
              savedParams.customerNameExactMatch || "exact",
            addressExactMatch: savedParams.addressExactMatch || "partial",
            dateRestrict: savedParams.dateRestrict || "all",
            isAdvancedSearchEnabled:
              savedParams.isAdvancedSearchEnabled || false,
            additionalKeywords: savedParams.additionalKeywords || [],
            searchSites: savedParams.searchSites || [],
            siteSearchMode: savedParams.siteSearchMode || "any",
          },
        };
        console.log(
          "dateRestrict",
          formData.googleCustomSearchParams.dateRestrict
        );
        console.log("発火");
        // フォームの値を更新
        form.reset(formData);
        //
        if (formData.googleCustomSearchParams.customerName) {
          setGoogleCustomSearchPattern(formData);
        }
      }
    }
  }, [data, searchParams]);

  return (
    <Context.Provider
      value={{
        patternId,
        isNewSearch,
        mode,
        googleCustomSearchPattern,
        handleSearch,
        data,
        isLoading,
        isValidating,
        error,
      }}
    >
      <Form {...form}>{children}</Form>
    </Context.Provider>
  );
}

export const useGoogleCustomSearchForm = () => useContext(Context);
