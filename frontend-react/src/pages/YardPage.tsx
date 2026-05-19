import { useMemo, useState } from 'react'
import { formatNumber, numberValue, type Structure } from '../services/api'
import { useSteelTrackData } from '../services/useSteelTrackData'
import DataState from '../shared/DataState'
import DataTable from '../shared/DataTable'
import PageHeader from '../shared/PageHeader'
import { useUiStore } from '../stores/uiStore'

const yardColumns = 'ABCDEFGHIJK'.split('')

const YardPage = () => {
  const { data, isLoading, error } = useSteelTrackData()
  const [query, setQuery] = useState('')
  const [zoneFilter, setZoneFilter] = useState('all')
  const selectEntity = useUiStore((state) => state.selectEntity)
  const structures = useMemo(() => data?.structures ?? [], [data?.structures])
  const text = query.trim().toLowerCase()
  const filteredStructures = structures.filter((item) => {
    if (zoneFilter !== 'all' && (item.zone || 'A') !== zoneFilter) return false
    if (!text) return true
    return `${item.name} ${item.id} ${item.zone || ''}${numberValue(item.position_y) + 1}`.toLowerCase().includes(text)
  })
  const structuresByCell = useMemo(() => {
    const map = new Map<string, Structure[]>()
    for (const structure of structures) {
      const key = `${structure.zone || 'A'}${numberValue(structure.position_y) + 1}`
      map.set(key, [...(map.get(key) || []), structure])
    }
    return map
  }, [structures])
  const visibleKeys = new Set(filteredStructures.map((item) => `${item.zone || 'A'}${numberValue(item.position_y) + 1}`))
  const occupiedKeys = new Set(structures.map((item) => `${item.zone || 'A'}${numberValue(item.position_y) + 1}`))
  const totalCells = yardColumns.length * 50
  const occupancy = totalCells ? (occupiedKeys.size / totalCells) * 100 : 0
  const visibleRows = filteredStructures.slice(0, 60)

  if (isLoading || error || !data) return <DataState isLoading={isLoading} error={error} />

  return (
    <>
      <PageHeader
        eyebrow="Yard"
        title="Smart Component Yard"
        description="Bản đồ tập kết cấu kiện A-K / 1-50, tìm kiếm vị trí, xem layer và chọn cấu kiện trực tiếp từ grid."
      />

      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4"><small className="text-slate-500">Cell đang dùng</small><strong className="block text-2xl text-white">{occupiedKeys.size}/{totalCells}</strong></div>
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4"><small className="text-slate-500">Mức sử dụng</small><strong className="block text-2xl text-cyan-200">{formatNumber(occupancy, 1)}%</strong></div>
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4"><small className="text-slate-500">Cấu kiện</small><strong className="block text-2xl text-amber-200">{formatNumber(structures.length)}</strong></div>
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4"><small className="text-slate-500">Layer cao</small><strong className="block text-2xl text-red-300">{formatNumber(structures.filter((item) => numberValue(item.layer) >= 3).length)}</strong></div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-400/10 bg-[#061827] p-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm mã, tên cấu kiện, vị trí yard..."
          className="min-w-[260px] flex-1 rounded-xl border border-cyan-400/10 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-400/45"
        />
        <select
          value={zoneFilter}
          onChange={(event) => setZoneFilter(event.target.value)}
          className="rounded-xl border border-cyan-400/10 bg-slate-950/60 px-4 py-2 text-sm font-bold text-slate-200 outline-none"
        >
          <option value="all">Tất cả khu</option>
          {yardColumns.map((zone) => <option key={zone} value={zone}>Khu {zone}</option>)}
        </select>
      </div>

      <div className="rounded-3xl border border-cyan-400/10 bg-[#061827] p-5">
        <div className="mb-3 grid grid-cols-[34px_repeat(11,minmax(34px,1fr))] gap-1 text-center text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
          <span />
          {yardColumns.map((column) => <span key={column}>{column}</span>)}
        </div>
        <div className="grid max-h-[620px] gap-1 overflow-auto pr-1">
          {Array.from({ length: 50 }, (_unused, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-[34px_repeat(11,minmax(34px,1fr))] gap-1">
              <div className="flex h-8 items-center justify-center text-[10px] font-black text-slate-600">{rowIndex + 1}</div>
              {yardColumns.map((column) => {
                const key = `${column}${rowIndex + 1}`
                const cellStructures = structuresByCell.get(key) || []
                const occupied = cellStructures.length > 0
                const inFilter = !text && zoneFilter === 'all' ? true : visibleKeys.has(key)
                const first = cellStructures[0]
                return (
                  <button
                    key={key}
                    title={occupied ? cellStructures.map((item) => item.name).join(', ') : key}
                    onClick={() => first && selectEntity('structure', first.id)}
                    className={`flex h-8 items-center justify-center rounded-md border text-[10px] font-black transition ${
                      occupied && inFilter
                        ? 'border-blue-300/45 bg-blue-500/30 text-blue-50 shadow-[0_0_18px_rgba(59,130,246,.22)] hover:border-white/50 hover:bg-blue-400/45'
                        : occupied
                          ? 'border-slate-600/30 bg-slate-800/35 text-slate-500'
                          : 'border-cyan-400/5 bg-slate-950/40 text-slate-700 hover:border-cyan-400/20'
                    }`}
                  >
                    {occupied ? cellStructures.length : ''}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">Số trong ô là lượng cấu kiện tại cell. Click ô có dữ liệu để mở detail panel bên phải.</p>
      </div>

      <div className="mt-4">
        <DataTable<Structure>
          rows={visibleRows}
          onRowClick={(row) => selectEntity('structure', row.id)}
          columns={[
            { key: 'name', header: 'Cấu kiện', render: (row) => <strong className="text-amber-200">{row.name}</strong> },
            { key: 'zone', header: 'Vị trí', render: (row) => `${row.zone || 'A'}${numberValue(row.position_y) + 1}` },
            { key: 'layer', header: 'Layer', align: 'right', render: (row) => formatNumber(row.layer || 1) },
            { key: 'qty', header: 'Tồn', align: 'right', render: (row) => `${formatNumber(row.qty, 3)} ${row.unit || ''}` },
            { key: 'weight', header: 'Tải / CK', align: 'right', render: (row) => `${formatNumber(row.weight)} kg` },
          ]}
        />
      </div>

      <section className="mt-4 rounded-2xl border border-cyan-400/10 bg-[#061827] p-5">
        <h2 className="mb-4 text-lg font-black text-white">Chú giải vận hành yard</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-blue-300/30 bg-blue-500/20 p-3"><strong className="text-sm text-blue-100">Ô đang có cấu kiện</strong><p className="mt-1 text-xs text-slate-500">Số trong ô là lượng cấu kiện cùng vị trí.</p></div>
          <div className="rounded-xl border border-slate-600/30 bg-slate-800/35 p-3"><strong className="text-sm text-slate-200">Nằm ngoài bộ lọc</strong><p className="mt-1 text-xs text-slate-500">Có dữ liệu nhưng không khớp tìm kiếm/khu.</p></div>
          <div className="rounded-xl border border-cyan-400/5 bg-slate-950/40 p-3"><strong className="text-sm text-slate-300">Ô trống</strong><p className="mt-1 text-xs text-slate-500">Có thể dùng cho vị trí tập kết mới.</p></div>
          <div className="rounded-xl border border-red-400/15 bg-red-500/10 p-3"><strong className="text-sm text-red-200">Layer cao</strong><p className="mt-1 text-xs text-slate-500">{formatNumber(structures.filter((item) => numberValue(item.layer) >= 3).length)} cấu kiện đang ở layer từ 3 trở lên.</p></div>
        </div>
      </section>
    </>
  )
}

export default YardPage
