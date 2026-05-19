import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

interface Props {
  type: 'purchase' | 'usage';
  materialId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const TransactionModal: React.FC<Props> = ({ type, materialId, onClose, onSuccess }) => {
  const { data, refreshData } = useApp();
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [vatRate, setVatRate] = useState(10);
  const [supplierId, setSupplierId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);

  const material = data?.materials?.find((m: any) => m.id === materialId);
  const suppliers = data?.suppliers || [];
  const projects = data?.projects || [];

  useEffect(() => {
    if (material) setUnitPrice(material.cost);
  }, [material]);

  const subtotal = qty * unitPrice;
  const vatAmount = subtotal * vatRate / 100;
  const total = subtotal + vatAmount;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const uploadFiles = async (type: string): Promise<string[]> => {
    if (!files || files.length === 0) return [];
    const uploadedPaths: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      const id = `${type}_${Date.now()}_${i}`;
      const res = await fetch(`/api/upload/${type}/${id}`, { method: 'POST', body: formData });
      const json = await res.json();
      if (json.success) {
        // Chuyển file từ temp sang thư mục chính thức
        const moveRes = await fetch('/api/move-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: json.path, type })
        });
        const moveJson = await moveRes.json();
        if (moveJson.success) uploadedPaths.push(moveJson.path);
      }
    }
    return uploadedPaths;
  };

  const handleSubmit = async () => {
    if (type === 'purchase' && !supplierId) return alert('Chọn nhà cung cấp');
    if (type === 'usage' && !projectId) return alert('Chọn công trình');
    if (qty <= 0) return alert('Số lượng > 0');

    setLoading(true);
    const uploaded = await uploadFiles(type);
    const payload: any = {
      id: `txn_${Date.now()}`,
      mid: materialId,
      qty,
      unitPrice,
      vatRate,
      subtotal,
      vatAmount,
      totalAmount: total,
      note,
      type,
      date: new Date().toISOString().split('T')[0],
      datetime: new Date().toISOString(),
      attachment: JSON.stringify(uploaded.map(p => ({ path: p, name: p.split('/').pop() })))
    };
    if (type === 'purchase') payload.supplierId = supplierId;
    if (type === 'usage') payload.projectId = projectId;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        alert('✅ Thành công!');
        refreshData();
        onSuccess();
      } else {
        alert('❌ Lỗi: ' + result.error);
      }
    } catch (err) {
      alert('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const currentStock = material?.qty || 0;
  const afterStock = type === 'purchase' ? currentStock + qty : currentStock - qty;
  const isLowStock = afterStock <= (material?.low || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-hd">
          <span className="modal-title">{type === 'purchase' ? '📥 Nhập kho' : '📤 Xuất kho'}</span>
          <button className="xbtn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-bd">
          <div className="form-group"><label>Vật tư</label><input value={material?.name || ''} disabled /></div>
          <div className="form-group"><label>Số lượng</label><input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} /></div>
          <div className="form-group"><label>Đơn giá</label><input type="number" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))} /></div>
          <div className="form-group"><label>VAT (%)</label><input type="number" value={vatRate} onChange={e => setVatRate(Number(e.target.value))} /></div>

          {type === 'purchase' && (
            <div className="form-group">
              <label>Nhà cung cấp</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                <option value="">-- Chọn --</option>
                {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          {type === 'usage' && (
            <div className="form-group">
              <label>Công trình</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)}>
                <option value="">-- Chọn --</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div className="form-group"><label>Ghi chú</label><input value={note} onChange={e => setNote(e.target.value)} /></div>
          <div className="form-group"><label>📎 File đính kèm</label><input type="file" multiple onChange={handleFileChange} /></div>

          <div className="metric-card">
            <div>Thành tiền trước VAT: <strong>{subtotal.toLocaleString('vi-VN')} ₫</strong></div>
            <div>Tiền VAT ({vatRate}%): <strong>{vatAmount.toLocaleString('vi-VN')} ₫</strong></div>
            <div className="metric-val">Tổng thanh toán: {total.toLocaleString('vi-VN')} ₫</div>
          </div>

          <div className="smart-preview-grid">
            <div><small>Tồn hiện tại</small><strong>{currentStock.toLocaleString('vi-VN')} {material?.unit}</strong></div>
            <div><small>Sau giao dịch</small><strong className={isLowStock ? 'text-danger' : ''}>{afterStock.toLocaleString('vi-VN')} {material?.unit}</strong></div>
          </div>
          {isLowStock && <div className="text-danger">⚠️ Sau giao dịch sẽ dưới ngưỡng cảnh báo!</div>}
        </div>
        <div className="modal-ft">
          <button onClick={onClose}>Hủy</button>
          <button className="primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Đang xử lý...' : 'Xác nhận'}</button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;