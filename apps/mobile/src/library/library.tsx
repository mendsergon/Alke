import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { USER_PROGRAMS, type ProgramRow, type Template } from '../mock/mock-data';

/**
 * The programs the person has in their Library. It starts empty; adding a
 * template from Explore is the only thing that puts one in. No persistence
 * yet — that arrives with the local database.
 */
type LibraryState = {
  programs: ProgramRow[];
  has: (templateId: string) => boolean;
  addTemplate: (template: Template) => void;
};

const Ctx = createContext<LibraryState | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [programs, setPrograms] = useState<ProgramRow[]>(USER_PROGRAMS);
  const [added, setAdded] = useState<string[]>([]);

  const addTemplate = useCallback((template: Template) => {
    setAdded((prev) => (prev.includes(template.id) ? prev : [...prev, template.id]));
    setPrograms((prev) => {
      if (prev.some((p) => p.name === template.name)) return prev;
      return [
        ...prev,
        {
          name: template.name,
          // The first program added becomes the active one.
          status: prev.length === 0 ? 'Active' : 'Saved',
          detail: `Not started · ${template.daysPerWeek} days`,
          done: 0,
          target: 100,
        },
      ];
    });
  }, []);

  const value = useMemo<LibraryState>(
    () => ({ programs, has: (id: string) => added.includes(id), addTemplate }),
    [programs, added, addTemplate],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLibrary(): LibraryState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLibrary used outside LibraryProvider');
  return v;
}
