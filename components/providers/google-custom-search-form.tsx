'use client';

import { DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN } from '@/lib/constants/google-custom-search';
import { googleCustomSearchPatternSchema } from '@/lib/schemas/custom-search';
import { useGoogleCustomSearch } from '@/lib/swr/google-custom-search';
import { GoogleCustomSearchPattern, GoogleSearchRequestResponse } from '@/lib/types/custom-search';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { Form } from '../ui/form';

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

export function GoogleCustomSearchFormProvider({ children, searchId }: { children: ReactNode, searchId: string }) {
  const isNewSearch = searchId === "create";
  const [mode, setMode] = useState<"sidebar" | "full">("full");
  const [googleCustomSearchPattern, setGoogleCustomSearchPattern] = useState<GoogleCustomSearchPattern>();
  const form = useForm<GoogleCustomSearchPattern>({
    resolver: zodResolver(googleCustomSearchPatternSchema),
    // mode: "onChange",
    defaultValues: DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN,
    });
  const handleSearch = async (formData: GoogleCustomSearchPattern) => {
      console.log("formData", formData);
      setGoogleCustomSearchPattern(formData);
  }
  const {data, isLoading, isValidating, error} = useGoogleCustomSearch(googleCustomSearchPattern);

  console.log("data",data)

  useEffect(() => {
    if (data) {
      setMode("sidebar");
    } else {
      setMode("full");
    }
  }, [data]);


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
      <Form {...form}>
        {children}
      </Form>
    </Context.Provider>
  );
}

export const useGoogleCustomSearchForm = () => useContext(Context);