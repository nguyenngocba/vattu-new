import { useEffect, useState } from 'react';
import { fetchMaterials, Material } from '../services/materialService';

export const useInventory = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [refresh, setRefresh] = useState(0);

  const load = () => fetchMaterials().then(setMaterials);
  useEffect(() => { load(); }, [refresh]);

  const reload = () => setRefresh(prev => prev + 1);
  return { materials, reload };
};