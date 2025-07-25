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
  useCallback,
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
  patterns: SearchPattern[];
};

const Context = createContext<ContextType>({} as ContextType);

export function GoogleCustomSearchFormProvider({
  children,
  selectedSearchPattern,
  patterns,
}: {
  children: ReactNode;
  selectedSearchPattern?: SearchPattern;
  patterns: SearchPattern[];
}) {
  const searchParams = useSearchParams();
  const urlPatternId = searchParams.get("patternId") || "new";
  const isNewSearch = urlPatternId === "new";
  const [mode, setMode] = useState<"sidebar" | "full">("full");
  const [googleCustomSearchPattern, setGoogleCustomSearchPattern] =
    useState<GoogleCustomSearchPattern>();
  const [lastLoadedPatternId, setLastLoadedPatternId] = useState<string | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [currentSelectedPattern, setCurrentSelectedPattern] = useState<
    SearchPattern | undefined
  >(selectedSearchPattern);

  // URLのpatternIdに基づいて動的にパターンを選択
  const dynamicSelectedPattern =
    patterns.find((pattern) => pattern.id === urlPatternId) ||
    selectedSearchPattern;

  const defaultValues = isNewSearch
    ? DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN
    : {
        ...DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN,
        patternId: isNewSearch ? undefined : urlPatternId,
      };

  // searchIdが変更されても、明示的に更新されるまでは古い値を保持
  const form = useForm<GoogleCustomSearchPattern>({
    resolver: zodResolver(googleCustomSearchPatternSchema),
    mode: "onChange",
    defaultValues,
  });

  // パターンの内容が変更されているかチェックする関数
  const isPatternModified = (
    formData: GoogleCustomSearchPattern,
    originalPattern?: SearchPattern
  ) => {
    if (!originalPattern || !formData.patternId) return false;

    const savedParams = originalPattern.googleCustomSearchParams;
    const currentParams = formData.googleCustomSearchParams;

    // 各設定項目を比較（customerNameとaddressは除外）
    return (
      savedParams.customerNameExactMatch !==
        currentParams.customerNameExactMatch ||
      savedParams.addressExactMatch !== currentParams.addressExactMatch ||
      savedParams.dateRestrict !== currentParams.dateRestrict ||
      savedParams.isAdvancedSearchEnabled !==
        currentParams.isAdvancedSearchEnabled ||
      JSON.stringify(savedParams.additionalKeywords) !==
        JSON.stringify(currentParams.additionalKeywords) ||
      JSON.stringify(savedParams.searchSites) !==
        JSON.stringify(currentParams.searchSites) ||
      savedParams.siteSearchMode !== currentParams.siteSearchMode
    );
  };

  const handleSearch = useCallback(
    async (formData: GoogleCustomSearchPattern) => {
      setIsSearching(true);

      // パターンが変更されている場合はpatternIdをnullに設定
      if (formData.patternId && dynamicSelectedPattern) {
        if (isPatternModified(formData, dynamicSelectedPattern)) {
          formData.patternId = undefined;
        }
      }

      setGoogleCustomSearchPattern(formData);
    },
    [dynamicSelectedPattern]
  );

  const { data, isLoading, isValidating, error } = useGoogleCustomSearch({
    formData: googleCustomSearchPattern,
  });
  

  // 検索結果に基づくモード切り替え
  useEffect(() => {
    if (data) {
      setMode("sidebar");
      setIsSearching(false);
    } else if (!isLoading) {
      setMode("full");
    }
  }, [data, isLoading]);

  // ページネーション処理（startパラメータの変更）
  useEffect(() => {
    const page = searchParams.get("start");
    if (page && googleCustomSearchPattern) {
      const currentFormValues = form.getValues();
      currentFormValues.googleCustomSearchParams.startPage = parseInt(page);
      setGoogleCustomSearchPattern(currentFormValues);
    }
  }, [searchParams, form, googleCustomSearchPattern]);

  // 動的にselectedPatternを更新
  useEffect(() => {
    if (
      dynamicSelectedPattern &&
      dynamicSelectedPattern.id !== currentSelectedPattern?.id
    ) {
      setCurrentSelectedPattern(dynamicSelectedPattern);
    }
  }, [dynamicSelectedPattern, urlPatternId, currentSelectedPattern?.id]);

  // パターンIDの変更を検知して読み込み
  useEffect(() => {
    const urlPatternId = searchParams.get("patternId");

    // 新規作成の場合はフォームをリセット
    if (!urlPatternId || urlPatternId === "new") {
      setCurrentSelectedPattern(undefined);
      // 前回のパターンIDと異なる場合のみリセット
      if (lastLoadedPatternId !== "new") {
        form.reset(DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN);
        setLastLoadedPatternId("new");
        setGoogleCustomSearchPattern(undefined);
      }
      return;
    }

    // 既に読み込み済みかつ検索中でない場合はスキップ
    if (urlPatternId === lastLoadedPatternId && !isSearching) {
      return;
    }

    // 検索中はパターンの切り替えをスキップ
    if (isSearching) {
      return;
    }

    if (dynamicSelectedPattern && dynamicSelectedPattern.id === urlPatternId) {
      console.log("パターン読み込み開始:", urlPatternId);

      // パターンのparamsをパース
      const savedParams = dynamicSelectedPattern.googleCustomSearchParams;
      const currentFormValues = form.getValues();

      // フォームにデータを設定（customerNameとaddressは現在の値を維持）
      const formData: GoogleCustomSearchPattern = {
        id: dynamicSelectedPattern.id,
        searchPatternName: dynamicSelectedPattern.searchPatternName,
        searchPatternDescription:
          dynamicSelectedPattern.searchPatternDescription || undefined,
        googleCustomSearchParams: {
          // 現在のフォームの顧客名と住所を維持
          customerName: currentFormValues.googleCustomSearchParams.customerName,
          address: currentFormValues.googleCustomSearchParams.address,
          // その他の設定はパターンから読み込む
          customerNameExactMatch: savedParams.customerNameExactMatch || "exact",
          addressExactMatch: savedParams.addressExactMatch || "partial",
          dateRestrict: savedParams.dateRestrict || "all",
          isAdvancedSearchEnabled: savedParams.isAdvancedSearchEnabled || false,
          additionalKeywords: savedParams.additionalKeywords || [],
          searchSites: savedParams.searchSites || [],
          siteSearchMode: savedParams.siteSearchMode || "any",
        },
        patternId: dynamicSelectedPattern.id,
      };

      // console.log("フォーム更新:", formData);

      // フォームの値を更新
      form.reset(formData);
      setLastLoadedPatternId(urlPatternId);

      // 顧客名がある場合は自動検索
      if (formData.googleCustomSearchParams.customerName) {
        console.log("自動検索実行");
        handleSearch(formData);
      }
    }
  }, [
    searchParams,
    dynamicSelectedPattern,
    form,
    handleSearch,
    lastLoadedPatternId,
    isSearching,
  ]);

  return (
    <Context.Provider
      value={{
        patternId: urlPatternId,
        isNewSearch,
        mode,
        googleCustomSearchPattern,
        handleSearch,
        data,
        isLoading,
        isValidating,
        error,
        patterns,
      }}
    >
      <Form {...form}>{children}</Form>
    </Context.Provider>
  );
}

export const useGoogleCustomSearchForm = () => useContext(Context);
