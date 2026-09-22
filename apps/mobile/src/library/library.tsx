import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { USER_PROGRAMS, type ProgramRow } from '../mock/mock-data';

/**
 * The programs the person has in their Library. It starts empty and stays
 * empty until the backend serves programs and templates.
 */
type LibraryState = {
  programs: ProgramRow[];
};

const Ctx = createContext<LibraryState | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [programs] = useState<ProgramRow[]>(USER_PROGRAMS);
  const value = useMemo<LibraryState>(() => ({ programs }), [programs]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLibrary(): LibraryState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLibrary used outside LibraryProvider');
  return v;
}
