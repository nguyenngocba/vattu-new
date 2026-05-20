export interface Material {
  id: string;
  name: string;
  cat?: string;
  unit?: string;
  qty: number;
  cost?: number;
  low?: number;
  note?: string;
}

export const fetchMaterials = async (): Promise<Material[]> => {
  const res = await fetch('/api/data');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const materials = json?.data?.materials ?? json?.materials;
  return Array.isArray(materials) ? materials : [];
};
