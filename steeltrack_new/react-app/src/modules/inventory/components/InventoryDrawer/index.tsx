import React, { useState } from 'react';
import { Material } from '../../services/materialService';

interface Props {
  material: Material;
  onClose: () => void;
  onUpdate: () => void;
}

export const InventoryDrawer: React.FC<Props> = ({ material, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const tabs = ['overview', 'transactions', 'analytics', 'suppliers', 'files'];

  return (
    <div className="material-detail-drawer" style={{ position: 'fixed', right: 0, top: 0, width: 550, height: '100%', background: 'var(--card-bg)', zIndex: 1000, padding: 20, boxShadow: '-2px 0 10px rgba(0,0,0,0.5)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>{material.name}</h2>
        <button onClick={onClose} className="xbtn">✕</button>
      </div>
      <div className="material-drawer-tabs" style={{ display: 'flex', gap: 10, borderBottom: '1px solid #444', marginBottom: 20 }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? 'active' : ''} style={{ padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === tab ? 'var(--accent)' : '#aaa' }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      <div className="material-drawer-content">
        {activeTab === 'overview' && (
          <div className="grid2">
            <div><small>Mã</small><strong>{material.id}</strong></div>
            <div><small>Loại</small><strong>{material.cat}</strong></div>
            <div><small>Đơn vị</small><strong>{material.unit}</strong></div>
            <div><small>Tồn kho</small><strong>{material.qty}</strong></div>
            <div><small>Đơn giá</small><strong>{material.cost?.toLocaleString('vi-VN')} đ</strong></div>
            <div><small>Ngưỡng cảnh báo</small><strong>{material.low}</strong></div>
            <div className="full"><small>Ghi chú</small><strong>{material.note || '—'}</strong></div>
          </div>
        )}
        {activeTab === 'transactions' && <div>📭 Sẽ hiển thị lịch sử giao dịch sau</div>}
        {activeTab === 'analytics' && <div>📊 Biểu đồ phân tích sẽ được thêm sau</div>}
        {activeTab === 'suppliers' && <div>🏭 Nhà cung cấp sẽ hiển thị ở đây</div>}
        {activeTab === 'files' && <div>📎 File đính kèm sẽ hiển thị ở đây</div>}
      </div>
    </div>
  );
};
