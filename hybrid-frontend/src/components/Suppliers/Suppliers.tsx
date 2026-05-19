import React from 'react';

interface Props {
  data: any;
}

const Suppliers: React.FC<Props> = ({ data }) => {
  const suppliers = data?.suppliers || [];

  return (
    <div className="card">
      <div className="sec-title">🏭 DANH SÁCH NHÀ CUNG CẤP</div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên nhà cung cấp</th>
              <th>Điện thoại</th>
              <th>Email</th>
              <th>Địa chỉ</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s: any) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td><strong>{s.name}</strong></td>
                <td>{s.phone || '—'}</td>
                <td>{s.email || '—'}</td>
                <td>{s.address || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Suppliers;