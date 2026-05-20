export interface Material {
  id: string;
  name: string;
  cat: string;
  unit: string;
  qty: number;
  cost: number;
  low: number;
  note?: string;
}

export const getSlowMovingCount = (materials: Material[], transactions: any[]): number => {
  // thực hiện tính
};
export const fetchMaterials = async (): Promise<Material[]> => {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const materials = json?.data?.materials;
    if (Array.isArray(materials)) return materials;
    console.warn('Không tìm thấy materials trong response:', json);
    return [];
  } catch (err) {
    console.error('fetchMaterials error:', err);
    return [];
  }
};

export const upsertMaterial = async (material: Material): Promise<{ success: boolean }> => {
  const res = await fetch('/api/materials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(material),
  });
  return res.json();
};

export const deleteMaterial = async (id: string): Promise<{ success: boolean }> => {
  const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
  return res.json();
};
