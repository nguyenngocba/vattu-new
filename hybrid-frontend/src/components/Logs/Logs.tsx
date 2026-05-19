import React from 'react';

interface Props {
  data: any;
}

const Logs: React.FC<Props> = ({ data }) => {
  const logs = data?.logs || [];

  return (
    <div className="card">
      <div className="sec-title">📋 NHẬT KÝ HỆ THỐNG</div>
      <div className="tbl-wrap">
        <table style={{ minWidth: '600px' }}>
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người dùng</th>
              <th>Hành động</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id}>
                <td>{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                <td>{log.userName || 'System'}</td>
                <td>{log.action}</td>
                <td>{log.details || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Logs;