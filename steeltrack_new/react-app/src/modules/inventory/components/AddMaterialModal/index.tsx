import React, { useState } from 'react';
import { upsertMaterial, Material } from '../../services/materialService';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddMaterialModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState<Partial<Material>>({
    id: '',
    name: '',
    cat: '',
    unit: '',
    qty: 0,
    cost: 0,
    low: 5,
    note: ''
  });

  const handleSubmit = async () => {
    if (!form.id || !form.name) return alert('Vui lòng nhập mã và tên');
    const res = await upsertMaterial(form as Material);
    if (res.success) {
      onSuccess();
      onClose();
    } else alert('Lỗi khi lưu');
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal" style={{ background: '#1e1e2f', padding: 24, borderRadius: 8, width: 500 }}>
        <h2>➕ Thêm vật tư mới</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input placeholder="Mã *" value={form.id} onChange={e => setForm({...form, id: e.target.value})} />
          <input placeholder="Tên *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <input placeholder="Danh mục" value={form.cat} onChange={e => setForm({...form, cat: e.target.value})} />
          <input placeholder="Đơn vị" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
          <input type="number" placeholder="Số lượng" value={form.qty} onChange={e => setForm({...form, qty: parseFloat(e.target.value)})} />
          <input type="number" placeholder="Đơn giá" value={form.cost} onChange={e => setForm({...form, cost: parseFloat(e.target.value)})} />
          <input type="number" placeholder="Ngưỡng cảnh báo" value={form.low} onChange={e => setForm({...form, low: parseFloat(e.target.value)})} />
        </div>
        <textarea placeholder="Ghi chú" value={form.note} onChange={e => setForm({...form, note: e.target.value})} style={{ width: '100%', marginTop: 10 }} />
        <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Hủy</button>
          <button className="primary" onClick={handleSubmit}>Lưu</button>
        </div>
      </div>
    </div>
  );
};