import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  Component,
  LayoutDashboard,
  Map,
  Handshake,
  Settings,
  Truck,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Kho vật tư', icon: Boxes },
  { to: '/components', label: 'Cấu kiện', icon: Component },
  { to: '/yard', label: 'Yard Map', icon: Map },
  { to: '/projects', label: 'Công trình', icon: Building2 },
  { to: '/suppliers', label: 'Nhà cung cấp', icon: Handshake },
  { to: '/logistics', label: 'Logistics', icon: Truck },
  { to: '/analytics', label: 'Báo cáo', icon: BarChart3 },
  { to: '/settings', label: 'Hệ thống', icon: Settings },
]

const Sidebar = () => {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-cyan-400/10 bg-[#03111f]">
      <div className="border-b border-cyan-400/10 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-blue-400/30 bg-blue-500/15 shadow-[0_0_24px_rgba(59,130,246,.22)]">
            <ClipboardList className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide text-white">STEELTRACK</h1>
            <p className="text-xs font-medium text-cyan-300">Smart Yard OS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-bold transition',
                  isActive
                    ? 'border-blue-400/40 bg-blue-500/18 text-white shadow-[0_0_28px_rgba(31,122,255,.18)]'
                    : 'border-transparent text-slate-400 hover:border-cyan-400/15 hover:bg-cyan-400/8 hover:text-slate-100',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="m-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
        <p className="text-xs uppercase tracking-[.18em] text-slate-500">System Phase</p>
        <strong className="mt-2 block text-sm text-slate-100">Phase 1: Application Shell</strong>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Backend cũ vẫn chạy. Frontend mới đang dựng shell để migrate từng module.
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
