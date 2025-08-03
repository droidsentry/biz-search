"use client";

import { createContext, ReactNode, useContext, useState } from "react";

type ViewMode = "grid" | "table";

type ContextType = {
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
};

const Context = createContext<ContextType>({} as ContextType);

// Cookie名の定数
const VIEW_MODE_COOKIE = "project_view_mode";

export function ProjectProvider({
  children,
  defaultViewMode = "grid",
}: {
  children: ReactNode;
  defaultViewMode?: ViewMode;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);

  // viewModeが変更されたらCookieに保存
  const handleSetViewMode = (newMode: ViewMode) => {
    setViewMode(newMode);
    // 1年間有効なCookieとして保存
    document.cookie = `${VIEW_MODE_COOKIE}=${newMode}; path=/; max-age=${
      60 * 60 * 24 * 365
    }; SameSite=Lax`;
  };

  return (
    <Context.Provider
      value={{
        viewMode,
        setViewMode: handleSetViewMode,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useProject = () => useContext(Context);
