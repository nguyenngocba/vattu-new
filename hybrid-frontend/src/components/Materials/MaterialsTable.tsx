import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import TransactionModal from '../Transactions/TransactionModal';
import MaterialForm from '../MaterialForm/MaterialForm';

const MaterialsTable: React.FC = () => {
  const { data, refreshData } = useApp();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [minStock, setMinStock] = useState('');
  const [maxStock, setMaxStock] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modal, setModal] = useState<{ type: 'purchase' | 'usage' | 'edit' | 'add'; materialId?: string } | null>(null);

  const materials = data?.materials || [];

  const filtered = useMemo(() => {
    let list = [...materials];
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(kw) || m.id.toLowerCase().includes(kw));
    }
    if (category !== 'all') list = list.filter(m => m.cat === category);
    if (minStock) list = list.filter(m => m.qty >= Number(minStock));
    if (maxStock) list = list.filter(m => m.qty <= Number(maxStock));
    return list;
  }, [materials, keyword, category, minStock, maxStock]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const deleteMaterial = async (id: string) => {
    if (!confirm('Xóa vật tư này?')) return;
    const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
    if (res.ok) refreshData();
    else alert('Xóa thất bại');
  };

  return (
    <div className="card">
      <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>📋 DANH SÁCH VẬT TƯ</span>
        <button className="sm primary" onClick={() => setModal({ type: 'add' })}>+ Thêm vật tư</button>
      </div>

      {/* Thanh tìm kiếm và lọc */}
      <div className="form-grid2" style={{ marginBottom: 16 }}>
        <input type="text" placeholder="Tìm theo tên hoặc mã" value={keyword} onChange={e => setKeyword(e.target.value)} />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="all">-- Tất cả danh mục --</option>
          {data?.categories?.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <input type="number" placeholder="Tồn ≥" value={minStock} onChange={e => setMinStock(e.target.value)} />
        <input type="number" placeholder="Tồn ≤" value={maxStock} onChange={e => setMaxStock(e.target.value)} />
      </div>

      {/* Bảng dữ liệu */}
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã</th><th>Tên</th><th>Loại</th><th>ĐVT</th><th>Tồn</th><th>Đơn giá</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(mat => (
              <tr key={mat.id}>
                <td>{mat.id}</td>
                <td><strong>{mat.name}</strong></td>
                <td>{mat.cat}</td>
                <td>{mat.unit}</td>
                <td>{Number(mat.qty).toLocaleString('vi-VN')}</td>
                <td>{Number(mat.cost).toLocaleString('vi-VN')} ₫</td>
                <td>
                  <button className="sm" onClick={() => setModal({ type: 'purchase', materialId: mat.id })}>📥 Nhập</button>
                  <button className="sm" onClick={() => setModal({ type: 'usage', materialId: mat.id })}>📤 Xuất</button>
                  <button className="sm" onClick={() => setModal({ type: 'edit', materialId: mat.id })}>✏️ Sửa</button>
                  <button className="sm danger-btn" onClick={() => deleteMaterial(mat.id)}>🗑️ Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className="pagination" style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
        <span>Trang {currentPage} / {totalPages}</span>
        <div>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)}>◀ Trước</button>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p+1)}>Sau ▶</button>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>10 dòng</option>
            <option value={20}>20 dòng</option>
            <option value={50}>50 dòng</option>
          </select>
        </div>
      </div>

      {/* Modal popup */}
      {modal && modal.type === 'purchase' && modal.materialId && (
        <TransactionModal
          type="purchase"
          materialId={modal.materialId}
          onClose={() => setModal(null)}
          onSuccess={() => { refreshData(); setModal(null); }}
        />
      )}
      {modal && modal.type === 'usage' && modal.materialId && (
        <TransactionModal
          type="usage"
          materialId={modal.materialId}
          onClose={() => setModal(null)}
          onSuccess={() => { refreshData(); setModal(null); }}
        />
      )}
      {(modal?.type === 'add' || (modal?.type === 'edit' && modal.materialId)) && (
        <MaterialForm
          materialId={modal.type === 'edit' ? modal.materialId : undefined}
          onClose={() => setModal(null)}
          onSuccess={() => { refreshData(); setModal(null); }}
        />
      )}
    </div>
  );
};

export default MaterialsTable;