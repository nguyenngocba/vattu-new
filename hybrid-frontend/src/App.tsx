import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Dashboard from './components/Dashboard/Dashboard';
import MaterialsTable from './components/Materials/MaterialsTable';
import Structures from './components/Structures/Structures';
import Projects from './components/Projects/Projects';
import Suppliers from './components/Suppliers/Suppliers';
import Logs from './components/Logs/Logs';
import Settings from './components/Settings/Settings';
import Sidebar from './components/Sidebar/Sidebar';
import Topbar from './components/Topbar/Topbar';
import './styles/globals.css';

const AppContent: React.FC = () => {
  const [currentPane, setCurrentPane] = useState('dashboard');
  const { data, loading, error } = useApp();

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
  if (error) return <div className="error">Lỗi: {error}</div>;
  if (!data) return <div className="error">Không có dữ liệu</div>;

  const renderPane = () => {
    switch (currentPane) {
      case 'dashboard': return <Dashboard data={data} />;
      case 'entry': return <MaterialsTable />;
      case 'structures': return <Structures data={data} />;
      case 'projects': return <Projects data={data} />;
      case 'suppliers': return <Suppliers data={data} />;
      case 'logs': return <Logs data={data} />;
      case 'settings': return <Settings data={data} />;
      default: return <Dashboard data={data} />;
    }
  };

  return (
    <div id="app-layout" className="desktop-shell">
      <Sidebar currentPane={currentPane} onNavigate={setCurrentPane} />
      <div className="main-content">
        <Topbar currentPane={currentPane} />
        <div className="pane active">{renderPane()}</div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;