import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, Search, ShieldCheck } from 'lucide-react'
import { formatMoney, formatNumber, numberValue } from '../services/api'
import { useSteelTrackData } from '../services/useSteelTrackData'
import { useAuthStore } from '../stores/authStore'
import { useUiStore } from '../stores/uiStore'
import DataTable from '../shared/DataTable'
import Modal from '../shared/Modal'

type SearchItem = {
  type: 'material' | 'structure' | 'project' | 'supplier'
  id: string
  title: string
  subtitle: string
  route: string
}

const Topbar = () => {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const selectEntity = useUiStore((state) => state.selectEntity)
  const { data } = useSteelTrackData()
  const navigate = useNavigate()
  const [modal, setModal] = useState<null | 'search' | 'calendar' | 'alerts'>(null)
  const [query, setQuery] = useState('')

  const lowMaterials = (data?.materials || []).filter((material) => numberValue(material.qty) <= numberValue(material.low))
  const overBudgetProjects = (data?.projects || []).filter((project) => numberValue(project.budget) > 0 && numberValue(project.spent) > numberValue(project.budget))
  const alertCount = lowMaterials.length + overBudgetProjects.length

  const searchItems = useMemo<SearchItem[]>(() => {
    if (!data) return []
    return [
      ...data.materials.map((item) => ({ type: 'material' as const, id: item.id, title: item.name, subtitle: `${item.cat || 'Vật tư'} · ${formatNumber(item.qty, 3)} ${item.unit || ''}`, route: '/inventory' })),
      ...data.structures.map((item) => ({ type: 'structure' as const, id: item.id, title: item.name, subtitle: `Cấu kiện · Yard ${item.zone || 'A'}${numberValue(item.position_y) + 1}`, route: '/components' })),
      ...data.projects.map((item) => ({ type: 'project' as const, id: item.id, title: item.name, subtitle: `Công trình · ${formatMoney(item.spent)} / ${formatMoney(item.budget)}`, route: '/projects' })),
      ...data.suppliers.map((item) => ({ type: 'supplier' as const, id: item.id, title: item.name, subtitle: `Nhà cung cấp · ${item.phone || item.email || 'chưa có liên hệ'}`, route: '/suppliers' })),
    ]
  }, [data])

  const filteredSearchItems = searchItems
    .filter((item) => `${item.title} ${item.id} ${item.subtitle}`.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 50)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setModal('search')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const openSearchItem = (item: SearchItem) => {
    navigate(item.route)
    selectEntity(item.type, item.id)
    setModal(null)
    setQuery('')
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-cyan-400/10 bg-[#041322]/95 px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Steel Structure ERP Platform</p>
          <h2 className="text-sm font-semibold text-slate-300">Smart Component Yard Operating System</h2>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden w-96 items-center gap-2 rounded-xl border border-cyan-400/10 bg-slate-950/50 px-3 py-2 text-left lg:flex" onClick={() => setModal('search')}>
            <Search className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-500">Tìm vật tư, cấu kiện, công trình...</span>
            <kbd className="ml-auto rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400">Ctrl K</kbd>
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/10 bg-slate-950/50 text-slate-300 hover:text-white" onClick={() => setModal('calendar')}>
            <CalendarDays className="h-4 w-4" />
          </button>
          <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/10 bg-slate-950/50 text-slate-300 hover:text-white" onClick={() => setModal('alerts')}>
            <Bell className="h-4 w-4" />
            {alertCount ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">{alertCount}</span> : null}
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/8 px-3 py-2 text-sm font-bold text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            Realtime Ready
          </div>
          <button onClick={logout} className="rounded-xl border border-cyan-400/10 bg-slate-950/50 px-3 py-2 text-left text-sm text-slate-300">
            <strong className="block leading-4 text-white">{user?.name || user?.username}</strong>
            <span className="text-xs text-slate-500">Đăng xuất</span>
          </button>
        </div>
      </header>

      {modal === 'search' ? (
        <Modal
          title="Tìm kiếm toàn hệ thống"
          size="lg"
          onClose={() => setModal(null)}
          footer={<button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => setModal(null)}>Đóng</button>}
        >
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nhập tên vật tư, mã, cấu kiện, công trình, nhà cung cấp..."
            className="mb-4 w-full rounded-xl border border-cyan-400/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-400/45"
          />
          <div className="grid gap-2">
            {filteredSearchItems.map((item) => (
              <button className="rounded-xl border border-cyan-400/10 bg-slate-950/35 p-3 text-left transition hover:border-blue-300/35 hover:bg-blue-500/10" key={`${item.type}-${item.id}`} onClick={() => openSearchItem(item)}>
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm text-slate-100">{item.title}</strong>
                  <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[.12em] text-cyan-200">{item.type}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{item.id} · {item.subtitle}</p>
              </button>
            ))}
            {!filteredSearchItems.length ? <div className="rounded-xl border border-cyan-400/10 bg-slate-950/35 p-5 text-center text-sm text-slate-500">Không tìm thấy dữ liệu phù hợp.</div> : null}
          </div>
        </Modal>
      ) : null}

      {modal === 'calendar' ? (
        <Modal
          title="Kỳ dữ liệu"
          onClose={() => setModal(null)}
          footer={<button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => setModal(null)}>Đóng</button>}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
              <small className="text-slate-500">Ngày hiện tại</small>
              <strong className="mt-1 block text-2xl text-white">{new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</strong>
            </div>
            <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
              <small className="text-slate-500">Tổng giao dịch</small>
              <strong className="mt-1 block text-2xl text-white">{formatNumber(data?.transactions.length || 0)}</strong>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Bộ lọc ngày chi tiết nằm trong từng màn hình báo cáo/logistics. Nút này dùng để xem nhanh trạng thái kỳ dữ liệu hiện tại.
          </p>
        </Modal>
      ) : null}

      {modal === 'alerts' ? (
        <Modal
          title="Thông báo vận hành"
          size="lg"
          onClose={() => setModal(null)}
          footer={<button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => setModal(null)}>Đóng</button>}
        >
          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-red-400/15 bg-red-500/10 p-4"><small className="text-slate-500">Vật tư sắp hết</small><strong className="block text-2xl text-red-200">{formatNumber(lowMaterials.length)}</strong></div>
            <div className="rounded-xl border border-amber-400/15 bg-amber-500/10 p-4"><small className="text-slate-500">Công trình vượt ngân sách</small><strong className="block text-2xl text-amber-200">{formatNumber(overBudgetProjects.length)}</strong></div>
          </div>
          <DataTable
            rows={[
              ...lowMaterials.map((item) => ({ type: 'Vật tư', name: item.name, detail: `${formatNumber(item.qty, 3)} / ngưỡng ${formatNumber(item.low, 3)} ${item.unit || ''}`, tone: 'text-red-300' })),
              ...overBudgetProjects.map((item) => ({ type: 'Công trình', name: item.name, detail: `${formatMoney(item.spent)} / ${formatMoney(item.budget)}`, tone: 'text-amber-300' })),
            ]}
            emptyText="Không có cảnh báo hiện tại"
            columns={[
              { key: 'type', header: 'Loại', render: (row) => <span className={`font-black ${row.tone}`}>{row.type}</span> },
              { key: 'name', header: 'Tên', render: (row) => <strong className="text-slate-100">{row.name}</strong> },
              { key: 'detail', header: 'Chi tiết', render: (row) => row.detail },
            ]}
          />
        </Modal>
      ) : null}
    </>
  )
}

export default Topbar
