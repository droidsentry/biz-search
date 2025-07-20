'use client';

import {
  ReactNode,
  createContext,
  useContext,
  useState,
} from 'react';

type ContextType = {
  viewMode: 'grid' | 'table'
  setViewMode: (viewMode: 'grid' | 'table') => void
};

const Context = createContext<ContextType>({} as ContextType);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  return (
    <Context
      value={{viewMode,setViewMode}}
    >
      {children}
    </Context>
  );
}

export const useProject = () => useContext(Context);