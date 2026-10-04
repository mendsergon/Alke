import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/auth';
import { listOwnPrograms, saveTemplate, type ProgramRecord } from '../backend/programs';

/**
 * The programs the person has in their Library, as PocketBase holds them.
 * Empty until they save one.
 */
type LibraryState = {
  programs: ProgramRecord[];
  /** Saves a template as the person's own copy. Resolves false if it did not save. */
  save: (template: ProgramRecord) => Promise<boolean>;
  /** Puts a program the person changed back in place. */
  replace: (program: ProgramRecord) => void;
  /** Takes a deleted program out of Library. */
  remove: (id: string) => void;
};

const Ctx = createContext<LibraryState | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { token, account } = useAuth();
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const ownerId = account?.id ?? null;

  useEffect(() => {
    if (!token || !ownerId) {
      setPrograms([]);
      return;
    }
    let live = true;
    void listOwnPrograms(token, ownerId).then((items) => {
      if (live && items) setPrograms(items);
    });
    return () => {
      live = false;
    };
  }, [token, ownerId]);

  const save = useCallback(
    async (template: ProgramRecord) => {
      if (!token || !ownerId) return false;
      const copy = await saveTemplate(token, ownerId, template);
      if (!copy) return false;
      setPrograms((current) => [...current, copy]);
      return true;
    },
    [token, ownerId],
  );

  const replace = useCallback((program: ProgramRecord) => {
    setPrograms((current) => current.map((p) => (p.id === program.id ? program : p)));
  }, []);

  const remove = useCallback((id: string) => {
    setPrograms((current) => current.filter((p) => p.id !== id));
  }, []);

  const value = useMemo<LibraryState>(() => ({ programs, save, replace, remove }), [programs, save, replace, remove]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLibrary(): LibraryState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLibrary used outside LibraryProvider');
  return v;
}
