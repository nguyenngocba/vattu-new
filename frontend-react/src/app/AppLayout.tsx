import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import RightPanel from './RightPanel'
import DashboardPage from '../pages/DashboardPage'
import InventoryPage from '../pages/InventoryPage'
import ProjectsPage from '../pages/ProjectsPage'
import SuppliersPage from '../pages/SuppliersPage'
import ComponentsPage from '../pages/ComponentsPage'
import YardPage from '../pages/YardPage'
import LogisticsPage from '../pages/LogisticsPage'
import AnalyticsPage from '../pages/AnalyticsPage'
import SettingsPage from '../pages/SettingsPage'

const AppLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#020b14] text-slate-100">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="min-h-0 flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/components" element={<ComponentsPage />} />
            <Route path="/yard" element={<YardPage />} />
            <Route path="/logistics" element={<LogisticsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>

      <RightPanel />
    </div>
  );
}

export default AppLayout
