import { useState, useCallback } from 'react';

export interface LTVHistoryEntry {
  id: string;
  savedAt: string;        // ISO — quando o relatório foi processado
  periodFrom: string;     // ISO — início do período usado no cálculo
  periodTo: string;       // ISO — fim do período usado no cálculo
  parsedFrom: string;     // rótulo extraído do relatório Overload
  ltv: number;
  cac: number | null;
  ratio: number | null;
  arpu: number;
  retentionMonths: number;
  activeSubscribers: number;
  newSubscribers: number;
  totalCost: number;
  warning?: string;
}

const STORAGE_KEY = 'sg_ltv_history';

function readStorage(): LTVHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeStorage(entries: LTVHistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useLTVHistory() {
  const [history, setHistory] = useState<LTVHistoryEntry[]>(readStorage);

  const addEntry = useCallback(
    (entry: Omit<LTVHistoryEntry, 'id' | 'savedAt'>) => {
      const newEntry: LTVHistoryEntry = {
        ...entry,
        id:      `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        savedAt: new Date().toISOString(),
      };
      setHistory((prev) => {
        const updated = [newEntry, ...prev];
        writeStorage(updated);
        return updated;
      });
    },
    [],
  );

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      writeStorage(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    writeStorage([]);
    setHistory([]);
  }, []);

  return { history, addEntry, removeEntry, clearHistory };
}
