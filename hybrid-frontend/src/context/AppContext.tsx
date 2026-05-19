import React, { createContext, useContext, useEffect, useState } from 'react';

interface AppData {
  materials: any[];
  transactions: any[];
  projects: any[];
  suppliers: any[];
  structures: any[];
  logs: any[];
  categories: string[];
  units: string[];
  projectSchedules: any[];
  projectMaterialUsage: any[];
  structureMaterials: any[];
}

interface AppContextType {
  data: AppData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/data');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.error || 'Lỗi tải dữ liệu');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshData = async () => {
    await fetchData();
  };

  return (
    <AppContext.Provider value={{ data, loading, error, refreshData }}>
      {children}
    </AppContext.Provider>
  );
};