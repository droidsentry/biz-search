"use client";

import { DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN } from "@/lib/constants/google-custom-search";
import { googleCustomSearchPatternSchema } from "@/lib/schemas/custom-search";
import { useGoogleCustomSearch } from "@/lib/swr/google-custom-search";
import {
  GoogleCustomSearchPattern,
  GoogleSearchRequestResponse,
} from "@/lib/types/custom-search";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { Form } from "../ui/form";
import { useSearchParams } from "next/navigation";

type ContextType = {
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
  patternId,
}: {
  children: ReactNode;
  patternId: string;
}) {
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

  useEffect(() => {
    const page = searchParams.get("start");
    if (data) {
      setMode("sidebar");
    } else {
      setMode("full");
    }
    if (page) {
      const currentFormData = form.getValues();
      currentFormData.googleCustomSearchParams.startPage = parseInt(page);
      setGoogleCustomSearchPattern(currentFormData);
    }
  }, [data, form, searchParams]);

  return (
    <Context.Provider
      value={{
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
