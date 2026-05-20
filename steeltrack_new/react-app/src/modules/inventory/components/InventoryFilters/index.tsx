import React from 'react';

interface Props {
  filters: any;
  setFilters: (f: any) => void;
}

export const InventoryFilters: React.FC<Props> = ({ filters, setFilters }) => {
  const categories = ['all', 'Thép hình', 'Thép tấm', 'Thép hộp', 'Ống thép', 'Bu lông - ốc vít', 'Vật tư hàn cắt', 'Sơn - Chống gỉ'];

  return (
    <div className="card inventory-filter-card">
      <div className="sec-title">🔍 TÌM KIẾM NÂNG CAO</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Tên hoặc mã..."
          value={filters.keyword}
          onChange={e => setFilters({ ...filters, keyword: e.target.value })}
          style={{ flex: 2, padding: 8 }}
        />
        <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} style={{ padding: 8 }}>
          {categories.map(c => <option key={c} value={c}>{c === 'all' ? '📂 Tất cả' : c}</option>)}
        </select>
        <input type="number" placeholder="Tồn ≥" value={filters.minStock} onChange={e => setFilters({ ...filters, minStock: e.target.value })} style={{ width: 100 }} />
        <input type="number" placeholder="Tồn ≤" value={filters.maxStock} onChange={e => setFilters({ ...filters, maxStock: e.target.value })} style={{ width: 100 }} />
        <button className="sm" onClick={() => setFilters({ keyword: '', category: 'all', minStock: '', maxStock: '', status: 'all', lowStockOnly: false, showFavoritesOnly: false })}>🗑️ Xóa bộ lọc</button>
      </div>
      <div className="inventory-status-filter">
        <button data-status="all" className={filters.status === 'all' ? 'active' : ''} onClick={() => setFilters({ ...filters, status: 'all' })}><span>Tất cả</span><b>{filters.status === 'all' ? '●' : ''}</b></button>
        <button data-status="low" className={filters.status === 'low' ? 'active' : ''} onClick={() => setFilters({ ...filters, status: 'low' })}><span>Sắp hết</span><b>!</b></button>
        <button data-status="out" className={filters.status === 'out' ? 'active' : ''} onClick={() => setFilters({ ...filters, status: 'out' })}><span>Hết hàng</span><b>✗</b></button>
        <button data-status="slow" className={filters.status === 'slow' ? 'active' : ''} onClick={() => setFilters({ ...filters, status: 'slow' })}><span>Chậm luân chuyển</span><b>↺</b></button>
      </div>
    </div>
  );
};
