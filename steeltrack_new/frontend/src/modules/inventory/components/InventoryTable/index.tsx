import { useEffect, useState } from 'react';
import { fetchMaterials, type Material } from '../../services/materialService';

export const InventoryTable: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials().then(data => {
      setMaterials(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Đang tải...</div>;

  return (
    <table className="inventory-table">
      <thead>
        <tr><th>Mã</th><th>Tên</th><th>Tồn</th><th>Đơn giá</th><th>Hành động</th></tr>
      </thead>
      <tbody>
        {materials.map(mat => (
          <tr key={mat.id}>
            <td>{mat.id}</td><td>{mat.name}</td><td>{mat.qty} {mat.unit}</td>
            <td>{mat.cost?.toLocaleString('vi-VN')} đ</td>
            <td><button type="button">Chi tiết</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
