import React, { useState, useEffect } from 'react';
import { fetchMaterials, Material, deleteMaterial } from '../../services/materialService';
import { onDataChanged } from '../../../../services/socket';
import { InventoryDrawer } from '../InventoryDrawer';
import { InventoryKPIs } from '../InventoryKPIs';
import { InventoryFilters } from '../InventoryFilters';
import { InventoryTable } from '../InventoryTable';
import { InventoryCharts } from '../InventoryCharts';
import { AddMaterialModal } from '../AddMaterialModal';

export const InventoryWorkspace: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filtered, setFiltered] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: '',
    category: 'all',
    status: 'all',
    lowStockOnly: false,
    showFavoritesOnly: false,
    minStock: '',
    maxStock: '',
  });
  const [showAddModal, setShowAddModal] = useState(false);

  const loadMaterials = async () => {
    setLoading(true);
    const data = await fetchMaterials();
    setMaterials(data);
    applyFilters(data, filters);
    setLoading(false);
  };

  const applyFilters = (data: Material[], currentFilters: typeof filters) => {
    let result = [...data];
    if (currentFilters.keyword) {
      const kw = currentFilters.keyword.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(kw) || m.id.toLowerCase().includes(kw));
    }
    if (currentFilters.category !== 'all') {
      result = result.filter(m => m.cat === currentFilters.category);
    }
    if (currentFilters.minStock) {
      result = result.filter(m => m.qty >= Number(currentFilters.minStock));
    }
    if (currentFilters.maxStock) {
      result = result.filter(m => m.qty <= Number(currentFilters.maxStock));
    }
    if (currentFilters.status === 'low') {
      result = result.filter(m => m.qty > 0 && m.qty <= m.low);
    } else if (currentFilters.status === 'out') {
      result = result.filter(m => m.qty <= 0);
    }
    setFiltered(result);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Xóa vật tư này?')) {
      await deleteMaterial(id);
      loadMaterials();
    }
  };

  useEffect(() => {
    loadMaterials();
    const unsubscribe = onDataChanged(() => loadMaterials());
    return unsubscribe;
  }, []);

  useEffect(() => {
    applyFilters(materials, filters);
  }, [filters, materials]);

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div className="inventory-workbench">
      <InventoryKPIs materials={materials} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
       <button className="primary" onClick={() => setShowAddModal(true)}>+ Thêm vật tư</button>
     </div>
      <InventoryFilters filters={filters} setFilters={setFilters} />
      <InventoryTable materials={filtered} onRowClick={(m) => setSelectedMaterial(m)} onDelete={handleDelete} />
      {selectedMaterial && (
        <InventoryDrawer
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
          onUpdate={loadMaterials}
        />
      )}
      <InventoryCharts materials={materials} />
      {showAddModal && (
       <AddMaterialModal
         onClose={() => setShowAddModal(false)}
         onSuccess={() => {
           loadMaterials();
           setShowAddModal(false);
         }}
       />
     )}
    </div>
  );
};