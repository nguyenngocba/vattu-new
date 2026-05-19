import { useMemo, useState } from 'react'
import { Boxes, Building2, Handshake, Layers3, MapPinned, PackageSearch, Route, X } from 'lucide-react'
import { formatMoney, formatNumber, numberValue, parseAttachment, type Transaction } from '../services/api'
import { useSteelTrackData } from '../services/useSteelTrackData'
import { useUiStore } from '../stores/uiStore'
import DataTable from '../shared/DataTable'
import Modal from '../shared/Modal'

const EmptyPanel = () => (
  <>
    <div className="rounded-2xl border border-cyan-400/10 bg-slate-950/45 p-4">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">Right Panel</p>
      <h2 className="mt-2 text-lg font-black">Chi tiết nhanh</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Chọn một dòng trong kho, cấu kiện, công trình hoặc nhà cung cấp để xem thông tin nhanh.
      </p>
    </div>

    <div className="mt-4 grid gap-3">
      {[
        { icon: Boxes, label: 'Đối tượng', value: 'Chưa chọn' },
        { icon: MapPinned, label: 'Vị trí yard', value: 'A-K / 1-50' },
        { icon: Layers3, label: 'Stack layer', value: 'Đọc từ dữ liệu cấu kiện' },
        { icon: Route, label: 'Logistics', value: 'Theo giao dịch xuất/trả' },
      ].map((item) => {
        const Icon = item.icon
        return (
          <div key={item.label} className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Icon className="h-4 w-4 text-cyan-300" />
              <span className="text-sm font-bold">{item.label}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{item.value}</p>
          </div>
        )
      })}
    </div>
  </>
)

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-3">
    <small className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">{label}</small>
    <strong className="mt-1 block break-words text-sm text-slate-100">{value}</strong>
  </div>
)

const transactionValue = (txn: Transaction) => numberValue(txn.totalAmount ?? txn.total_amount)
const transactionPrice = (txn: Transaction) => numberValue(txn.unitPrice ?? txn.unit_price)
const transactionProjectId = (txn: Transaction) => txn.projectId ?? txn.project_id ?? ''
const transactionSupplierId = (txn: Transaction) => txn.supplierId ?? txn.supplier_id ?? ''
const transactionDate = (txn: Transaction) => {
  const value = txn.datetime || txn.date
  return value ? new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—'
}

const RightPanel = () => {
  const { selectedEntityType, selectedEntityId, selectEntity } = useUiStore()
  const { data } = useSteelTrackData()
  const [panelMode, setPanelMode] = useState<null | 'detail' | 'history'>(null)

  const material = selectedEntityType === 'material' ? data?.materials.find((item) => item.id === selectedEntityId) : null
  const structure = selectedEntityType === 'structure' ? data?.structures.find((item) => item.id === selectedEntityId) : null
  const project = selectedEntityType === 'project' ? data?.projects.find((item) => item.id === selectedEntityId) : null
  const supplier = selectedEntityType === 'supplier' ? data?.suppliers.find((item) => item.id === selectedEntityId) : null
  const title = material?.name || structure?.name || project?.name || supplier?.name || ''

  const historyRows = useMemo(() => {
    const transactions = data?.transactions || []
    if (material) return transactions.filter((txn) => txn.mid === material.id)
    if (structure) return transactions.filter((txn) => txn.mid === structure.id)
    if (project) return transactions.filter((txn) => transactionProjectId(txn) === project.id)
    if (supplier) return transactions.filter((txn) => transactionSupplierId(txn) === supplier.id)
    return []
  }, [data?.transactions, material, project, structure, supplier])

  const sortedHistory = [...historyRows].sort((a, b) => new Date(b.datetime || b.date || '').getTime() - new Date(a.datetime || a.date || '').getTime())

  return (
    <>
      <aside className="hidden w-80 shrink-0 border-l border-cyan-400/10 bg-[#03111f] p-4 text-white xl:block">
        {!title ? <EmptyPanel /> : (
          <>
            <div className="rounded-2xl border border-cyan-400/10 bg-slate-950/45 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">{selectedEntityType}</p>
                  <h2 className="mt-2 text-lg font-black leading-tight">{title}</h2>
                </div>
                <button className="grid h-8 w-8 place-items-center rounded-lg border border-cyan-400/10 text-slate-400 hover:text-white" onClick={() => selectEntity(null, null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {material ? (
                <>
                  <Field label="Mã vật tư" value={material.id} />
                  <Field label="Nhóm" value={material.cat || '—'} />
                  <Field label="Tồn kho" value={`${formatNumber(material.qty, 3)} ${material.unit || ''}`} />
                  <Field label="Giá trị tồn" value={formatMoney(numberValue(material.qty) * numberValue(material.cost))} />
                  <Field label="Trạng thái" value={numberValue(material.qty) <= numberValue(material.low) ? 'Sắp hết' : 'OK'} />
                </>
              ) : null}

              {structure ? (
                <>
                  <Field label="Mã cấu kiện" value={structure.id} />
                  <Field label="Yard" value={`${structure.zone || 'A'}${numberValue(structure.position_y) + 1} · Layer ${numberValue(structure.layer) || 1}`} />
                  <Field label="Tồn kho" value={`${formatNumber(structure.qty, 3)} ${structure.unit || ''}`} />
                  <Field label="Giá trị tồn" value={formatMoney(numberValue(structure.qty) * numberValue(structure.cost))} />
                  <Field label="Tải / cấu kiện" value={`${formatNumber(structure.weight)} kg`} />
                </>
              ) : null}

              {project ? (
                <>
                  <Field label="Mã công trình" value={project.id} />
                  <Field label="Ngân sách" value={formatMoney(project.budget)} />
                  <Field label="Đã dùng" value={formatMoney(project.spent)} />
                  <Field label="Tỷ lệ" value={`${formatNumber(numberValue(project.budget) ? (numberValue(project.spent) / numberValue(project.budget)) * 100 : 0, 1)}%`} />
                </>
              ) : null}

              {supplier ? (
                <>
                  <Field label="Mã NCC" value={supplier.id} />
                  <Field label="Điện thoại" value={supplier.phone || '—'} />
                  <Field label="Email" value={supplier.email || '—'} />
                  <Field label="Địa chỉ" value={supplier.address || '—'} />
                </>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-slate-200">
                {material ? <PackageSearch className="h-4 w-4 text-blue-300" /> : null}
                {structure ? <Layers3 className="h-4 w-4 text-amber-300" /> : null}
                {project ? <Building2 className="h-4 w-4 text-violet-300" /> : null}
                {supplier ? <Handshake className="h-4 w-4 text-emerald-300" /> : null}
                Thao tác nhanh
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="rounded-lg border border-cyan-400/10 bg-slate-950/45 px-3 py-2 text-xs font-black text-slate-300 hover:border-blue-300/30 hover:text-white" onClick={() => setPanelMode('detail')}>Chi tiết</button>
                <button className="rounded-lg border border-cyan-400/10 bg-slate-950/45 px-3 py-2 text-xs font-black text-slate-300 hover:border-blue-300/30 hover:text-white" onClick={() => setPanelMode('history')}>Lịch sử</button>
              </div>
            </div>
          </>
        )}
      </aside>

      {panelMode === 'detail' && title ? (
        <Modal
          title={`Chi tiết: ${title}`}
          size="lg"
          onClose={() => setPanelMode(null)}
          footer={<button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => setPanelMode(null)}>Đóng</button>}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {material ? (
              <>
                <Field label="Mã vật tư" value={material.id} />
                <Field label="Nhóm" value={material.cat || '—'} />
                <Field label="Đơn vị" value={material.unit || '—'} />
                <Field label="Tồn kho" value={`${formatNumber(material.qty, 3)} ${material.unit || ''}`} />
                <Field label="Ngưỡng cảnh báo" value={`${formatNumber(material.low, 3)} ${material.unit || ''}`} />
                <Field label="Đơn giá" value={formatMoney(material.cost)} />
                <Field label="Giá trị tồn" value={formatMoney(numberValue(material.qty) * numberValue(material.cost))} />
                <Field label="Ghi chú" value={material.note || '—'} />
              </>
            ) : null}
            {structure ? (
              <>
                <Field label="Mã cấu kiện" value={structure.id} />
                <Field label="Loại" value={structure.type || '—'} />
                <Field label="Tồn kho" value={`${formatNumber(structure.qty, 3)} ${structure.unit || ''}`} />
                <Field label="Giá trị tồn" value={formatMoney(numberValue(structure.qty) * numberValue(structure.cost))} />
                <Field label="Vị trí yard" value={`${structure.zone || 'A'}${numberValue(structure.position_y) + 1} · Layer ${numberValue(structure.layer) || 1}`} />
                <Field label="Kích thước/tải" value={`${formatNumber(structure.weight)} kg / cấu kiện`} />
                <Field label="BOM" value={`${structure.materials?.length || 0} vật tư`} />
                <Field label="Ghi chú" value={structure.note || '—'} />
              </>
            ) : null}
            {project ? (
              <>
                <Field label="Mã công trình" value={project.id} />
                <Field label="Ngân sách" value={formatMoney(project.budget)} />
                <Field label="Đã dùng" value={formatMoney(project.spent)} />
                <Field label="Còn lại" value={formatMoney(numberValue(project.budget) - numberValue(project.spent))} />
                <Field label="Tỷ lệ dùng" value={`${formatNumber(numberValue(project.budget) ? (numberValue(project.spent) / numberValue(project.budget)) * 100 : 0, 1)}%`} />
                <Field label="Trạng thái ngân sách" value={numberValue(project.spent) > numberValue(project.budget) ? 'Vượt ngân sách' : 'Trong ngân sách'} />
              </>
            ) : null}
            {supplier ? (
              <>
                <Field label="Mã NCC" value={supplier.id} />
                <Field label="Tên" value={supplier.name} />
                <Field label="Điện thoại" value={supplier.phone || '—'} />
                <Field label="Email" value={supplier.email || '—'} />
                <Field label="Địa chỉ" value={supplier.address || '—'} />
                <Field label="Số giao dịch nhập" value={formatNumber(historyRows.length)} />
                <Field label="Tổng giá trị nhập" value={formatMoney(historyRows.reduce((sum, txn) => sum + transactionValue(txn), 0))} />
              </>
            ) : null}
          </div>
        </Modal>
      ) : null}

      {panelMode === 'history' && title ? (
        <Modal
          title={`Lịch sử: ${title}`}
          size="xl"
          onClose={() => setPanelMode(null)}
          footer={<button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => setPanelMode(null)}>Đóng</button>}
        >
          <DataTable<Transaction>
            rows={sortedHistory.slice(0, 120)}
            emptyText="Chưa có giao dịch liên quan"
            columns={[
              { key: 'time', header: 'Thời gian', render: (row) => transactionDate(row) },
              { key: 'type', header: 'Loại', render: (row) => <span className="font-black text-cyan-200">{row.type || '—'}</span> },
              { key: 'qty', header: 'SL', align: 'right', render: (row) => formatNumber(row.qty, 3) },
              { key: 'price', header: 'Đơn giá', align: 'right', render: (row) => formatMoney(transactionPrice(row)) },
              { key: 'value', header: 'Giá trị', align: 'right', render: (row) => formatMoney(transactionValue(row)) },
              { key: 'note', header: 'Ghi chú', render: (row) => row.note || '—' },
              {
                key: 'files',
                header: 'File',
                render: (row) => {
                  const files = parseAttachment(row.attachment)
                  return files.length ? (
                    <div className="flex max-w-[220px] flex-col gap-1">
                      {files.slice(0, 3).map((file) => <a className="truncate text-xs font-bold text-blue-300 hover:text-white" href={file.path} target="_blank" rel="noreferrer" key={`${file.path}-${file.name}`}>{file.name}</a>)}
                    </div>
                  ) : '—'
                },
              },
            ]}
          />
        </Modal>
      ) : null}
    </>
  )
}

export default RightPanel
