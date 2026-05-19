import React from 'react';

interface Props {
  data: any;
}

const Settings: React.FC<Props> = ({ data }) => {
  const categories = data?.categories || [];
  const units = data?.units || [];

  return (
    <div className="card">
      <div className="sec-title">⚙️ CÀI ĐẶT HỆ THỐNG</div>
      <div className="grid2">
        <div className="metric-card">
          <div className="metric-label">📂 DANH MỤC VẬT TƯ</div>
          <ul>
            {categories.map((cat: string, idx: number) => <li key={idx}>{cat}</li>)}
          </ul>
        </div>
        <div className="metric-card">
          <div className="metric-label">📏 ĐƠN VỊ TÍNH</div>
          <ul>
            {units.map((unit: string, idx: number) => <li key={idx}>{unit}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;