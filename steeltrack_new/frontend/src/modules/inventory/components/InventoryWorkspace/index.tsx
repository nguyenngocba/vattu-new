import { useState, useEffect, useMemo } from 'react';
import { fetchMaterials, type Material } from '../../services/materialService';
import { onDataChanged } from '../../../../services/socket';

export const InventoryWorkspace: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const loadMaterials = () => {
    fetchMaterials().then(data => {
      setMaterials(data);
    });
  };

  useEffect(() => {
    loadMaterials();
    const unsubscribe = onDataChanged(() => {
      loadMaterials();
    });
    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    let result = [...materials];
    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(kw) || m.id.toLowerCase().includes(kw));
    }
    if (category !== 'all') {
      result = result.filter(m => m.cat === category);
    }
    return result;
  }, [keyword, category, materials]);

  const categories = ['all', ...new Set(materials.map(m => m.cat).filter(Boolean))];
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="inventory-workspace" style={{ padding: '20px' }}>
      <h1>📦 Quản lý vật tư</h1>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Tìm theo tên hoặc mã..."
          value={keyword}
          onChange={e => {
            setKeyword(e.target.value);
            setCurrentPage(1);
          }}
          style={{ padding: '8px', flex: 2 }}
        />
        <select
          value={category}
          onChange={e => {
            setCategory(e.target.value);
            setCurrentPage(1);
          }}
          style={{ padding: '8px' }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat === 'all' ? '📂 Tất cả danh mục' : cat}</option>
          ))}
        </select>
      </div>

      <table border={1} cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#333', color: '#fff' }}>
          <tr><th>Mã</th><th>Tên</th><th>Loại</th><th>Đơn vị</th><th>Tồn kho</th><th>Đơn giá</th></tr>
        </thead>
        <tbody>
          {paginated.map(mat => (
            <tr key={mat.id}>
              <td>{mat.id}</td><td>{mat.name}</td><td>{mat.cat}</td>
              <td>{mat.unit}</td><td>{mat.qty}</td><td>{mat.cost?.toLocaleString('vi-VN')} đ</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>◀ Trang trước</button>
        <span>Trang {currentPage} / {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Trang sau ▶</button>
      </div>
    </div>
  );
};
