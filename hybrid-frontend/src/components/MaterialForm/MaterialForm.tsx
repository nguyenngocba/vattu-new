import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

interface Props {
  materialId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const MaterialForm: React.FC<Props> = ({ materialId, onClose, onSuccess }) => {
  const { data, refreshData } = useApp();
  const [name, setName] = useState('');
  const [cat, setCat] = useState('');
  const [unit, setUnit] = useState('');
  const [cost, setCost] = useState(0);
  const [low, setLow] = useState(5);
  const [note, setNote] = useState('');

  const isEdit = !!materialId;
  const material = isEdit ? data?.materials?.find((m: any) => m.id === materialId) : null;

  useEffect(() => {
    if (material) {
      setName(material.name);
      setCat(material.cat);
      setUnit(material.unit);
      setCost(material.cost);
      setLow(material.low);
      setNote(material.note || '');
    }
  }, [material]);

  const handleSubmit = async () => {
    if (!name) return alert('Tên vật tư không được để trống');
    const payload = {
      id: materialId || `mat_${Date.now()}`,
      name,
      cat,
      unit,
      qty: material?.qty || 0,
      cost,
      low,
      note,
    };
    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      alert(isEdit ? 'Cập nhật thành công' : 'Thêm thành công');
      refreshData();
      onSuccess();
    } else {
      alert('Lỗi khi lưu');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-hd">
          <span className="modal-title">{isEdit ? '✏️ Sửa vật tư' : '➕ Thêm vật tư'}</span>
          <button className="xbtn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-bd">
          <div className="form-group"><label>Tên vật tư *</label><input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="form-group"><label>Danh mục</label>
            <select value={cat} onChange={e => setCat(e.target.value)}>
              {data?.categories?.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Đơn vị tính</label>
            <select value={unit} onChange={e => setUnit(e.target.value)}>
              {data?.units?.map((u: string) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Đơn giá (VNĐ)</label><input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} /></div>
          <div className="form-group"><label>Ngưỡng cảnh báo tồn</label><input type="number" value={low} onChange={e => setLow(Number(e.target.value))} /></div>
          <div className="form-group"><label>Ghi chú</label><textarea value={note} onChange={e => setNote(e.target.value)} rows={2} /></div>
        </div>
        <div className="modal-ft">
          <button onClick={onClose}>Hủy</button>
          <button className="primary" onClick={handleSubmit}>Lưu</button>
        </div>
      </div>
    </div>
  );
};

export default MaterialForm;