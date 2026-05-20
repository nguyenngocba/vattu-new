import React from 'react';
import { Material } from '../../services/materialService';

interface Props { materials: Material[]; }

export const InventoryKPIs: React.FC<Props> = ({ materials }) => {
  const totalValue = materials.reduce((sum, m) => sum + (m.qty || 0) * (m.cost || 0), 0);
  const totalQty = materials.reduce((sum, m) => sum + (m.qty || 0), 0);
  const lowCount = materials.filter(m => (m.qty || 0) <= (m.low || 0)).length;
  const outCount = materials.filter(m => (m.qty || 0) <= 0).length;

  // TODO: slow moving (dựa trên transactions – sẽ thêm sau)
  const slowCount = 0;

  return (
    <div className="inventory-kpi-strip">
      <div className="inventory-kpi-card blue">
        <small>Tổng giá trị tồn kho</small>
        <strong>{totalValue.toLocaleString('vi-VN')} ₫</strong>
        <em>{materials.length} chủng loại</em>
      </div>
      <div className="inventory-kpi-card green">
        <small>Tổng số vật tư</small>
        <strong>{totalQty.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</strong>
        <em>Khối lượng/số lượng</em>
      </div>
      <div className="inventory-kpi-card red">
        <small>Sắp hết hàng</small>
        <strong>{lowCount}</strong>
        <em>{outCount} hết hàng</em>
      </div>
      <div className="inventory-kpi-card purple">
        <small>Chậm luân chuyển</small>
        <strong>{slowCount}</strong>
        <em>Trên 90 ngày</em>
      </div>
    </div>
  );
};
