import React from 'react';

interface Props {
  currentPane: string;
}

const Topbar: React.FC<Props> = ({ currentPane }) => {
  const titles: Record<string, string> = {
    dashboard: 'Bảng điều khiển',
    entry: 'Quản lý kho',
    structures: 'Quản lý cấu kiện',
    projects: 'Quản lý công trình',
    suppliers: 'Quản lý nhà cung cấp',
    logs: 'Nhật ký hệ thống',
    settings: 'Cài đặt',
  };

  return (
    <div className="topbar">
      <div className="topbar-title">{titles[currentPane] || 'SteelTrack'}</div>
    </div>
  );
};

export default Topbar;