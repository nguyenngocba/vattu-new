import React from 'react';

interface Props {
  data: any;
}

const Projects: React.FC<Props> = ({ data }) => {
  const projects = data?.projects || [];
  return (
    <div className="card">
      <div className="sec-title">🏗️ DANH SÁCH CÔNG TRÌNH</div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Mã</th><th>Tên công trình</th><th>Ngân sách</th><th>Đã chi</th></tr></thead>
          <tbody>
            {projects.map((p: any) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td><strong>{p.name}</strong></td>
                <td>{Number(p.budget).toLocaleString('vi-VN')} ₫</td>
                <td>{Number(p.spent).toLocaleString('vi-VN')} ₫</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Projects;