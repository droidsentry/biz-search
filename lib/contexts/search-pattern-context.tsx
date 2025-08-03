"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { SearchPattern } from "@/lib/types/serpapi";

interface SearchPatternContextType {
  currentPattern: SearchPattern | undefined;
  setCurrentPattern: React.Dispatch<React.SetStateAction<SearchPattern | undefined>>;
}

const SearchPatternContext = createContext<SearchPatternContextType | undefined>(
  undefined
);

export function SearchPatternProvider({ children }: { children: ReactNode }) {
  const [currentPattern, setCurrentPattern] = useState<SearchPattern | undefined>();

  return (
    <SearchPatternContext.Provider value={{ currentPattern, setCurrentPattern }}>
      {children}
    </SearchPatternContext.Provider>
  );
}

export function useSearchPattern() {
  const context = useContext(SearchPatternContext);
  if (context === undefined) {
    throw new Error("useSearchPattern must be used within a SearchPatternProvider");
  }
  return context;
}