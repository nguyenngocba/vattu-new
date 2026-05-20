import React, { useState } from 'react';
import { Material } from '../../services/materialService';

interface Props {
  materials: Material[];
  onRowClick: (m: Material) => void;
  onEdit?: (m: Material) => void;
  onDelete?: (id: string) => void;
}

export const InventoryTable: React.FC<Props> = ({ materials, onRowClick, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.ceil(materials.length / pageSize);
  const paginated = materials.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (m: Material) => {
    const qty = m.qty || 0;
    const low = m.low || 0;
    if (qty <= 0) return { label: 'Hết hàng', className: 'danger', icon: '!' };
    if (qty <= low) return { label: 'Sắp hết', className: 'warn', icon: '▲' };
    // TODO: slow moving
    return { label: 'Tốt', className: 'good', icon: '✓' };
  };

  return (
    <div className="card inventory-table-card">
      <div className="sec-title">📋 DANH SÁCH VẬT TƯ TỒN KHO</div>
      <div className="tbl-wrap">
        <table style={{ minWidth: 1000 }}>
          <thead>
            <tr><th>STT</th><th>Mã</th><th>Tên</th><th>Loại</th><th>ĐVT</th><th>Tồn kho</th><th>Đơn giá</th><th>Tổng giá trị</th><th>TT</th><th>Ghi chú</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {paginated.map((m, idx) => {
              const status = getStatusBadge(m);
              return (
                <tr key={m.id} onClick={() => onRowClick(m)} style={{ cursor: 'pointer' }}>
                  <td>{((currentPage - 1) * pageSize) + idx + 1}</td>
                  <td>{m.id}</td>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.cat}</td>
                  <td>{m.unit}</td>
                  <td>{m.qty?.toLocaleString('vi-VN')}</td>
                  <td>{m.cost?.toLocaleString('vi-VN')} đ</td>
                  <td>{((m.qty || 0) * (m.cost || 0)).toLocaleString('vi-VN')} đ</td>
                  <td><span className={`inventory-status-badge ${status.className}`}><b>{status.icon}</b>{status.label}</span></td>
                  <td>{m.note?.substring(0, 30) || '—'}</td>
                  <td>
                    {onEdit && <button className="sm" onClick={(e) => { e.stopPropagation(); onEdit(m); }}>Sửa</button>}
                    {onDelete && <button className="sm danger-btn" onClick={(e) => { e.stopPropagation(); onDelete(m.id); }}>Xóa</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 10 }}>
        <button className="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>◀ Trang trước</button>
        <span>Trang {currentPage} / {totalPages}</span>
        <button className="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Trang sau ▶</button>
      </div>
    </div>
  );
};
