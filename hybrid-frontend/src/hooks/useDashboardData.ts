import { useEffect, useState } from 'react';

export interface AppData {
  materials: any[];
  transactions: any[];
  projects: any[];
  suppliers: any[];
  structures: any[];
  logs: any[];
  categories: string[];
  units: string[];
}

export const useDashboardData = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error);
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

  return { data, loading, error, refresh: fetchData };
};