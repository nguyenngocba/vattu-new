import React from 'react';

interface Props {
  data: any;
}

const Dashboard: React.FC<Props> = ({ data }) => {
  const materials = data?.materials || [];
  const transactions = data?.transactions || [];
  const projects = data?.projects || [];
  const suppliers = data?.suppliers || [];

  const totalValue = materials.reduce((sum: number, m: any) => sum + (Number(m.qty) * Number(m.cost)), 0);

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">📦</div>
          <div className="kpi-info">
            <div className="kpi-label">VẬT TƯ</div>
            <div className="kpi-value">{materials.length}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-info">
            <div className="kpi-label">GIÁ TRỊ TỒN KHO</div>
            <div className="kpi-value">{totalValue.toLocaleString('vi-VN')} ₫</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🏗️</div>
          <div className="kpi-info">
            <div className="kpi-label">CÔNG TRÌNH</div>
            <div className="kpi-value">{projects.length}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🏭</div>
          <div className="kpi-info">
            <div className="kpi-label">NHÀ CUNG CẤP</div>
            <div className="kpi-value">{suppliers.length}</div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="sec-title">📜 GIAO DỊCH GẦN ĐÂY</div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Thời gian</th><th>Loại</th><th>Vật tư</th><th>Số lượng</th><th>Thành tiền</th></tr></thead>
            <tbody>
              {transactions.slice(0, 10).map((t: any) => {
                const mat = materials.find((m: any) => m.id === t.mid);
                return (
                  <tr key={t.id}>
                    <td>{new Date(t.datetime || t.date).toLocaleString('vi-VN')}</td>
                    <td>{t.type === 'purchase' ? 'Nhập' : t.type === 'usage' ? 'Xuất' : t.type}</td>
                    <td>{mat?.name || t.mid}</td>
                    <td>{Number(t.qty).toLocaleString('vi-VN')} {mat?.unit || ''}</td>
                    <td>{Number(t.totalAmount).toLocaleString('vi-VN')} ₫</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;