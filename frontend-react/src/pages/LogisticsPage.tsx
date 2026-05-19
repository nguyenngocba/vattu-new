import { useMemo, useState } from 'react'
import { formatCompactMoney, formatMoney, formatNumber, numberValue, parseAttachment, type Transaction } from '../services/api'
import { useSteelTrackData } from '../services/useSteelTrackData'
import DataState from '../shared/DataState'
import DataTable from '../shared/DataTable'
import PageHeader from '../shared/PageHeader'
import { useUiStore } from '../stores/uiStore'

const logisticsTypes = ['usage', 'structure_export', 'return', 'structure_return']
const txnAmount = (txn: Transaction) => numberValue(txn.totalAmount ?? txn.total_amount)
const txnProjectId = (txn: Transaction) => txn.projectId ?? txn.project_id ?? ''
const txnDate = (txn: Transaction) => {
  const value = txn.datetime || txn.date
  return value ? new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—'
}

const typeLabel = (type?: string) => {
  if (type === 'usage') return 'Xuất vật tư'
  if (type === 'structure_export') return 'Xuất cấu kiện'
  if (type === 'return') return 'Trả vật tư'
  if (type === 'structure_return') return 'Trả cấu kiện'
  return type || '—'
}

const LogisticsPage = () => {
  const { data, isLoading, error } = useSteelTrackData()
  const [typeFilter, setTypeFilter] = useState('all')
  const [query, setQuery] = useState('')
  const selectEntity = useUiStore((state) => state.selectEntity)

  const rows = useMemo(() => {
    const text = query.trim().toLowerCase()
    return (data?.transactions || [])
      .filter((txn) => logisticsTypes.includes(txn.type || ''))
      .filter((txn) => typeFilter === 'all' || txn.type === typeFilter)
      .filter((txn) => {
        if (!text) return true
        const project = data?.projects.find((item) => item.id === txnProjectId(txn))
        const material = data?.materials.find((item) => item.id === txn.mid)
        const structure = data?.structures.find((item) => item.id === txn.mid)
        return `${project?.name || ''} ${material?.name || ''} ${structure?.name || ''} ${txn.note || ''} ${txn.id}`.toLowerCase().includes(text)
      })
      .sort((a, b) => new Date(b.datetime || b.date || '').getTime() - new Date(a.datetime || a.date || '').getTime())
  }, [data?.materials, data?.projects, data?.structures, data?.transactions, query, typeFilter])

  if (isLoading || error || !data) return <DataState isLoading={isLoading} error={error} />

  const exportRows = rows.filter((txn) => txn.type === 'usage' || txn.type === 'structure_export')
  const returnRows = rows.filter((txn) => txn.type === 'return' || txn.type === 'structure_return')
  const activeProjectCount = new Set(rows.map((txn) => txnProjectId(txn)).filter(Boolean)).size
  const totalValue = rows.reduce((sum, txn) => sum + txnAmount(txn), 0)

  const itemName = (txn: Transaction) => {
    const material = data.materials.find((item) => item.id === txn.mid)
    const structure = data.structures.find((item) => item.id === txn.mid)
    return material?.name || structure?.name || txn.mid || '—'
  }

  const projectName = (txn: Transaction) => {
    const project = data.projects.find((item) => item.id === txnProjectId(txn))
    return project?.name || txnProjectId(txn) || '—'
  }

  return (
    <>
      <PageHeader
        eyebrow="Logistics"
        title="Điều phối xuất hàng"
        description="Theo dõi các luồng xuất/trả vật tư và cấu kiện theo công trình, có file đính kèm và trạng thái vận hành."
      />

      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4"><small className="text-slate-500">Phiếu xuất</small><strong className="block text-2xl text-blue-200">{formatNumber(exportRows.length)}</strong></div>
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4"><small className="text-slate-500">Phiếu trả</small><strong className="block text-2xl text-amber-200">{formatNumber(returnRows.length)}</strong></div>
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4"><small className="text-slate-500">Công trình phát sinh</small><strong className="block text-2xl text-violet-200">{formatNumber(activeProjectCount)}</strong></div>
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4"><small className="text-slate-500">Giá trị luồng</small><strong className="block text-2xl text-emerald-200">{formatCompactMoney(totalValue)}</strong></div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-400/10 bg-[#061827] p-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm công trình, vật tư, cấu kiện, ghi chú..."
          className="min-w-[260px] flex-1 rounded-xl border border-cyan-400/10 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-400/45"
        />
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="rounded-xl border border-cyan-400/10 bg-slate-950/60 px-4 py-2 text-sm font-bold text-slate-200 outline-none"
        >
          <option value="all">Tất cả luồng</option>
          <option value="usage">Xuất vật tư</option>
          <option value="structure_export">Xuất cấu kiện</option>
          <option value="return">Trả vật tư</option>
          <option value="structure_return">Trả cấu kiện</option>
        </select>
      </div>

      <DataTable<Transaction>
        rows={rows.slice(0, 120)}
        onRowClick={(row) => {
          if (row.type === 'structure_export' || row.type === 'structure_return') selectEntity('structure', row.mid || null)
          else selectEntity('material', row.mid || null)
        }}
        columns={[
          { key: 'date', header: 'Thời gian', render: (row) => txnDate(row) },
          { key: 'type', header: 'Luồng', render: (row) => <span className="font-black text-cyan-200">{typeLabel(row.type)}</span> },
          { key: 'item', header: 'Hàng hóa', render: (row) => <strong className="text-slate-100">{itemName(row)}</strong> },
          { key: 'target', header: 'Công trình', render: (row) => projectName(row) },
          { key: 'qty', header: 'SL', align: 'right', render: (row) => formatNumber(row.qty, 3) },
          { key: 'value', header: 'Giá trị', align: 'right', render: (row) => formatMoney(txnAmount(row)) },
          {
            key: 'files',
            header: 'File',
            render: (row) => {
              const files = parseAttachment(row.attachment)
              return files.length ? (
                <div className="grid max-w-[180px] gap-1">
                  {files.slice(0, 2).map((file) => <a key={`${file.path}-${file.name}`} href={file.path} target="_blank" rel="noreferrer" className="truncate text-blue-300">{file.name}</a>)}
                </div>
              ) : '—'
            },
          },
          { key: 'note', header: 'Ghi chú', render: (row) => row.note || '—' },
        ]}
      />
    </>
  )
}

export default LogisticsPage
