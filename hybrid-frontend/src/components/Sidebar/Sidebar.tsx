import React from 'react';

interface Props {
  currentPane: string;
  onNavigate: (pane: string) => void;
}

const Sidebar: React.FC<Props> = ({ currentPane, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Thống kê', icon: '📊' },
    { id: 'entry', label: 'Quản lý kho', icon: '📦' },
    { id: 'structures', label: 'Cấu kiện', icon: '🏗️' },
    { id: 'projects', label: 'Công trình', icon: '🏢' },
    { id: 'suppliers', label: 'Nhà cung cấp', icon: '🏭' },
    { id: 'logs', label: 'Nhật ký', icon: '📋' },
    { id: 'settings', label: 'Cài đặt', icon: '⚙️' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">SteelTrack Pro</div>
      <div className="sidebar-nav">
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${currentPane === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;