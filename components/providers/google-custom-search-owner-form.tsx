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
import { useSearchParams, usePathname } from "next/navigation";
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
  currentOwnerId: string | null;
};

const Context = createContext<ContextType>({} as ContextType);

export function GoogleCustomSearchOwnerFormProvider({
  children,
  patterns,
}: {
  children: ReactNode;
  patterns: SearchPattern[];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const urlPatternId = searchParams.get("patternId") || "new";
  const isNewSearch = urlPatternId === "new";
  const [mode, setMode] = useState<"sidebar" | "full">("full");
  const [googleCustomSearchPattern, setGoogleCustomSearchPattern] =
    useState<GoogleCustomSearchPattern>();
  const [previousOwnerId, setPreviousOwnerId] = useState<string | null>(null);
  const [currentOwnerId, setCurrentOwnerId] = useState<string | null>(null);

  const form = useForm<GoogleCustomSearchPattern>({
    resolver: zodResolver(googleCustomSearchPatternSchema),
    mode: "onChange",
    defaultValues: DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN,
  });

  // シンプルな検索ハンドラー
  const handleSearch = useCallback((formData: GoogleCustomSearchPattern) => {
    setGoogleCustomSearchPattern(formData);
  }, []);

  // SWRフックでデータを取得
  const { data, isLoading, isValidating, error } = useGoogleCustomSearch({
    formData: googleCustomSearchPattern,
  });

  // 検索結果に基づくモード切り替え
  useEffect(() => {
    if (data) {
      setMode("sidebar");
    } else {
      setMode("full");
    }
  }, [data]);

  // ownerIdが変わったら検索結果をクリア
  useEffect(() => {
    const ownerIdMatch = pathname.match(/\/projects\/[^\/]+\/([^\/]+)/);
    const newOwnerId = ownerIdMatch ? ownerIdMatch[1] : null;
    
    // 現在のownerIdを更新
    setCurrentOwnerId(newOwnerId);
    
    // 初回レンダリング時は処理しない
    if (previousOwnerId === null) {
      setPreviousOwnerId(newOwnerId);
      return;
    }
    
    // 顧客詳細ページでない場合、または別の顧客に移動した場合
    if (!newOwnerId || newOwnerId !== previousOwnerId) {
      setGoogleCustomSearchPattern(undefined); // 検索結果をクリア
      setPreviousOwnerId(newOwnerId);
      
      // フォームをデフォルト値にリセット（氏名と住所は後でowner-search.tsxで設定される）
      form.reset(DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN);
    }
  }, [pathname, previousOwnerId, form]);

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
        currentOwnerId,
      }}
    >
      <Form {...form}>{children}</Form>
    </Context.Provider>
  );
}

export const useGoogleCustomSearchOwnerForm = () => useContext(Context);
