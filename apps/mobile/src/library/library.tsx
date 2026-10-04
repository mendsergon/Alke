import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/auth';
import { deleteProgram, listOwnPrograms, saveTemplate, type ProgramRecord } from '../backend/programs';

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
  /** Takes the person's copies of a template out of Library. Resolves false if one did not go. */
  unsave: (template: ProgramRecord) => Promise<boolean>;
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
      // A template is saved once: a second press, from any screen, makes no
      // second copy.
      if (programs.some((p) => p.copied_from === template.id)) return true;
      const copy = await saveTemplate(token, ownerId, template);
      if (!copy) return false;
      setPrograms((current) => [...current, copy]);
      return true;
    },
    [token, ownerId, programs],
  );

  const replace = useCallback((program: ProgramRecord) => {
    setPrograms((current) => current.map((p) => (p.id === program.id ? program : p)));
  }, []);

  const unsave = useCallback(
    async (template: ProgramRecord) => {
      if (!token) return false;
      const copies = programs.filter((p) => p.copied_from === template.id);
      const gone = await Promise.all(copies.map((p) => deleteProgram(token, p.id).then((ok) => (ok ? p.id : null))));
      setPrograms((current) => current.filter((p) => !gone.includes(p.id)));
      return gone.every((id) => id !== null);
    },
    [token, programs],
  );

  const value = useMemo<LibraryState>(
    () => ({ programs, save, replace, unsave }),
    [programs, save, replace, unsave],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLibrary(): LibraryState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLibrary used outside LibraryProvider');
  return v;
}
