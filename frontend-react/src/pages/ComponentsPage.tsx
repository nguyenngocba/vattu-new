import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteStructure, exportStructure, fetchStructureWarehouse, fetchStructureWarehouseLogs, formatMoney, formatNumber, makeId, moveUploadedFiles, numberValue, parseAttachment, produceStructure, returnFromStructureWarehouse, returnStructure, saveStructure, transferToStructureWarehouse, type Material, type Structure, type StructureWarehouseItem, type UploadedFile } from '../services/api'
import { useSteelTrackData } from '../services/useSteelTrackData'
import DataState from '../shared/DataState'
import DataTable from '../shared/DataTable'
import FileUploader from '../shared/FileUploader'
import FormField from '../shared/FormField'
import Modal from '../shared/Modal'
import PageHeader from '../shared/PageHeader'
import SelectField from '../shared/SelectField'
import { useUiStore } from '../stores/uiStore'

type StructureDraft = {
  id: string
  name: string
  type: string
  unit: string
  qty: string
  cost: string
  zone: string
  position_y: string
  layer: string
  weight: string
  note: string
  bomRows: BomDraft[]
  original?: Structure
}

type BomDraft = {
  materialId: string
  quantity: string
}

type StructureOperationDraft = {
  type: 'produce' | 'export' | 'return'
  structureId: string
  projectId: string
  quantity: string
  note: string
  files: UploadedFile[]
}

type TransferRow = {
  materialId: string
  qty: string
}

type TransferDraft = {
  datetime: string
  rows: TransferRow[]
  note: string
  files: UploadedFile[]
}

type ReturnDraft = {
  materialId: string
  qty: string
  note: string
  datetime: string
  maxQty: number
}

const toDateTimeLocal = (date = new Date()) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return offsetDate.toISOString().slice(0, 16)
}

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—'

const emptyStructure = (): StructureDraft => ({
  id: makeId('K'),
  name: '',
  type: '',
  unit: 'cái',
  qty: '0',
  cost: '0',
  zone: 'A',
  position_y: '0',
  layer: '1',
  weight: '1200',
  note: '',
  bomRows: [],
})

const getMaterialMeta = (materials: Material[], materialId: string) =>
  materials.find((material) => material.id === materialId)

const ComponentsPage = () => {
  const { data, isLoading, error } = useSteelTrackData()
  const { data: structureWarehouse = [], isLoading: isLoadingWarehouse, error: warehouseError } = useQuery({
    queryKey: ['structure-warehouse'],
    queryFn: fetchStructureWarehouse,
  })
  const [query, setQuery] = useState('')
  const [yardFilter, setYardFilter] = useState('all')
  const [draft, setDraft] = useState<StructureDraft | null>(null)
  const [operationDraft, setOperationDraft] = useState<StructureOperationDraft | null>(null)
  const [transferDraft, setTransferDraft] = useState<TransferDraft | null>(null)
  const [returnDraft, setReturnDraft] = useState<ReturnDraft | null>(null)
  const [logItem, setLogItem] = useState<StructureWarehouseItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const queryClient = useQueryClient()
  const selectEntity = useUiStore((state) => state.selectEntity)
  const structures = useMemo(() => data?.structures ?? [], [data?.structures])
  const swLogsQuery = useQuery({
    queryKey: ['structure-warehouse-logs', logItem?.material_id],
    queryFn: () => fetchStructureWarehouseLogs(logItem?.material_id || ''),
    enabled: Boolean(logItem?.material_id),
  })

  const rows = useMemo(() => {
    const text = query.trim().toLowerCase()
    return [...structures]
      .filter((structure) => {
        if (yardFilter !== 'all' && (structure.zone || 'A') !== yardFilter) return false
        if (!text) return true
        return `${structure.name} ${structure.id} ${structure.zone || ''}`.toLowerCase().includes(text)
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      .slice(0, 80)
  }, [structures, query, yardFilter])

  if (isLoading || error || !data) return <DataState isLoading={isLoading} error={error} />

  const totalQty = structures.reduce((sum, item) => sum + numberValue(item.qty), 0)
  const totalValue = structures.reduce((sum, item) => sum + numberValue(item.qty) * numberValue(item.cost), 0)
  const warehouseValue = structureWarehouse.reduce((sum, item) => sum + numberValue(item.qty) * numberValue(item.cost), 0)
  const warehouseQty = structureWarehouse.reduce((sum, item) => sum + numberValue(item.qty), 0)
  const availableMaterials = data.materials.filter((material) => numberValue(material.qty) > 0)
  const structuresWithBom = structures.filter((structure) => (structure.materials || []).length > 0).length
  const structuresWithoutBom = structures.length - structuresWithBom
  const highLayerCount = structures.filter((structure) => numberValue(structure.layer) >= 3).length
  const openEdit = (structure: Structure) => setDraft({
    id: structure.id,
    name: structure.name,
    type: structure.type || '',
    unit: structure.unit || 'cái',
    qty: String(structure.qty || 0),
    cost: String(structure.cost || 0),
    zone: structure.zone || 'A',
    position_y: String(structure.position_y || 0),
    layer: String(structure.layer || 1),
    weight: String(structure.weight || 1200),
    note: structure.note || '',
    bomRows: (structure.materials || []).map((item) => ({
      materialId: item.material_id,
      quantity: String(item.quantity || 1),
    })),
    original: structure,
  })
 const submit = async () => {
    if (!draft?.name.trim()) return
    const bomMaterials = draft.bomRows
      .map((row) => {
        const warehouseItem = structureWarehouse.find((item) => item.material_id === row.materialId)
        const material = getMaterialMeta(data.materials, row.materialId)
        const quantity = numberValue(row.quantity)
        if (!row.materialId || quantity <= 0) return null
        return {
          structure_id: draft.id,
          material_id: row.materialId,
          material_name: warehouseItem?.material_name || material?.name || '',
          unit: warehouseItem?.unit || material?.unit || '',
          quantity,
        }
      })
      .filter((item): item is { structure_id: string; material_id: string; material_name: string; unit: string; quantity: number } => Boolean(item))
    const bomCost = bomMaterials.reduce((sum, item) => {
      const warehouseItem = structureWarehouse.find((row) => row.material_id === item.material_id)
      const material = getMaterialMeta(data.materials, item.material_id)
      return sum + item.quantity * numberValue(warehouseItem?.cost ?? material?.cost)
    }, 0)
    setSaving(true)
    setNotice(null)
    try {
      await saveStructure({
        ...(draft.original || {}),
        id: draft.id,
        name: draft.name,
        type: draft.type,
        unit: draft.unit,
        qty: numberValue(draft.qty),
        cost: bomMaterials.length ? bomCost : numberValue(draft.cost),
        zone: draft.zone,
        position_y: numberValue(draft.position_y),
        layer: numberValue(draft.layer),
        weight: numberValue(draft.weight),
        note: draft.note,
        materials: bomMaterials,
      })
      await queryClient.invalidateQueries({ queryKey: ['steeltrack-data'] })
      setDraft(null)
      setNotice({ type: 'success', text: 'Đã lưu cấu kiện và BOM.' })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Không lưu được cấu kiện' })
    } finally {
      setSaving(false)
    }
  }
  const remove = async (structure: Structure) => {
    if (!window.confirm(`Xóa cấu kiện "${structure.name}"?`)) return
    setNotice(null)
    try {
      await deleteStructure(structure.id)
      await queryClient.invalidateQueries({ queryKey: ['steeltrack-data'] })
      setNotice({ type: 'success', text: 'Đã xóa cấu kiện.' })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Không xóa được cấu kiện' })
    }
  }
  const openOperation = (type: StructureOperationDraft['type'], structure?: Structure) => setOperationDraft({
    type,
    structureId: structure?.id || rows[0]?.id || '',
    projectId: data.projects[0]?.id || '',
    quantity: '1',
    note: '',
    files: [],
  })
  const openTransfer = (materialId?: string) => setTransferDraft({
    datetime: toDateTimeLocal(),
    rows: [{ materialId: materialId || availableMaterials[0]?.id || '', qty: '1' }],
    note: 'Chuyển sang kho cấu kiện',
    files: [],
  })
  const invalidateWarehouse = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['steeltrack-data'] }),
      queryClient.invalidateQueries({ queryKey: ['structure-warehouse'] }),
      queryClient.invalidateQueries({ queryKey: ['structure-warehouse-logs'] }),
    ])
  }
  const submitTransfer = async () => {
    if (!transferDraft) return
    const items = transferDraft.rows
      .map((row) => {
        const material = getMaterialMeta(data.materials, row.materialId)
        return material ? {
          mid: material.id,
          name: material.name,
          unit: material.unit || '',
          qty: numberValue(row.qty),
          cost: numberValue(material.cost),
          stock: numberValue(material.qty),
        } : null
      })
      .filter((item): item is { mid: string; name: string; unit: string; qty: number; cost: number; stock: number } => Boolean(item))
    const invalid = items.find((item) => item.qty <= 0 || item.qty > item.stock)
    if (items.length === 0 || invalid) {
      setNotice({ type: 'error', text: invalid ? `Không đủ tồn để chuyển ${invalid.name}.` : 'Chưa có vật tư hợp lệ.' })
      return
    }
    setSaving(true)
    setNotice(null)
    try {
      const finalFiles = await moveUploadedFiles(transferDraft.files, 'transfer_sw')
      await transferToStructureWarehouse({
        items: items.map((item) => ({
          mid: item.mid,
          name: item.name,
          unit: item.unit,
          qty: item.qty,
          cost: item.cost,
        })),
        note: transferDraft.note,
        datetime: new Date(transferDraft.datetime).toISOString(),
        attachment: JSON.stringify(finalFiles),
      })
      await invalidateWarehouse()
      setTransferDraft(null)
      setNotice({ type: 'success', text: 'Đã chuyển vật tư sang kho cấu kiện.' })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Chuyển kho cấu kiện thất bại' })
    } finally {
      setSaving(false)
    }
  }
  const openReturn = (item: StructureWarehouseItem) => setReturnDraft({
    materialId: item.material_id,
    qty: '1',
    note: 'Trả lại kho chính',
    datetime: toDateTimeLocal(),
    maxQty: numberValue(item.qty),
  })
  const submitReturn = async () => {
    if (!returnDraft) return
    const qty = numberValue(returnDraft.qty)
    if (qty <= 0 || qty > returnDraft.maxQty) {
      setNotice({ type: 'error', text: `Số lượng trả phải nằm trong khoảng 0 - ${formatNumber(returnDraft.maxQty, 3)}.` })
      return
    }
    setSaving(true)
    setNotice(null)
    try {
      await returnFromStructureWarehouse({
        materialId: returnDraft.materialId,
        qty,
        note: returnDraft.note,
        datetime: new Date(returnDraft.datetime).toISOString(),
      })
      await invalidateWarehouse()
      setReturnDraft(null)
      setNotice({ type: 'success', text: 'Đã trả vật tư về kho chính.' })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Trả kho chính thất bại' })
    } finally {
      setSaving(false)
    }
  }
  const submitOperation = async () => {
    if (!operationDraft?.structureId || numberValue(operationDraft.quantity) <= 0) return
    setSaving(true)
    setNotice(null)
    try {
      const attachmentType = operationDraft.type === 'produce' ? 'produce' : operationDraft.type === 'export' ? 'structure_export' : 'structure_return'
      const finalFiles = await moveUploadedFiles(operationDraft.files, attachmentType)
      const input = {
        structureId: operationDraft.structureId,
        projectId: operationDraft.projectId,
        quantity: numberValue(operationDraft.quantity),
        note: operationDraft.note,
        attachment: JSON.stringify(finalFiles),
      }
      if (operationDraft.type === 'produce') await produceStructure(input)
      if (operationDraft.type === 'export') await exportStructure(input)
      if (operationDraft.type === 'return') await returnStructure(input)
      await invalidateWarehouse()
      setOperationDraft(null)
      setNotice({ type: 'success', text: operationDraft.type === 'produce' ? 'Đã sản xuất cấu kiện.' : operationDraft.type === 'export' ? 'Đã xuất cấu kiện ra công trình.' : 'Đã trả cấu kiện về kho.' })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Thao tác cấu kiện thất bại' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Cấu kiện"
        description="Quản lý cấu kiện, BOM, sản xuất, xuất/trả công trình và kho vật tư cấu kiện."
        actions={(
          <>
            <button className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-200" onClick={() => openOperation('produce')}>Sản xuất</button>
            <button className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-200" onClick={() => openOperation('export')}>Xuất CT</button>
            <button className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm font-black text-amber-200" onClick={() => openOperation('return')}>Trả CK</button>
            <button className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-black text-cyan-200" onClick={() => openTransfer()}>Chuyển vật tư</button>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white" onClick={() => setDraft(emptyStructure())}>+ Thêm cấu kiện</button>
          </>
        )}
      />

      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4"><small className="text-slate-500">Loại cấu kiện</small><strong className="block text-2xl text-white">{formatNumber(structures.length)}</strong></div>
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4"><small className="text-slate-500">Tổng tồn</small><strong className="block text-2xl text-amber-200">{formatNumber(totalQty)}</strong></div>
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4"><small className="text-slate-500">Giá trị tồn</small><strong className="block text-2xl text-blue-200">{formatMoney(totalValue)}</strong></div>
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4"><small className="text-slate-500">Kho CK</small><strong className="block text-2xl text-cyan-200">{formatNumber(warehouseQty, 3)}</strong></div>
      </div>
      {notice ? (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-bold ${notice.type === 'success' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-red-400/20 bg-red-500/10 text-red-200'}`}>
          {notice.text}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-400/10 bg-[#061827] p-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm cấu kiện, mã, vị trí yard..."
          className="min-w-[260px] flex-1 rounded-xl border border-cyan-400/10 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-400/45"
        />
        <select
          value={yardFilter}
          onChange={(event) => setYardFilter(event.target.value)}
          className="rounded-xl border border-cyan-400/10 bg-slate-950/60 px-4 py-2 text-sm font-bold text-slate-200 outline-none"
        >
          <option value="all">Tất cả khu</option>
          {'ABCDEFGHIJK'.split('').map((zone) => <option key={zone} value={zone}>Khu {zone}</option>)}
        </select>
      </div>

      <DataTable<Structure>
        rows={rows}
        onRowClick={(row) => selectEntity('structure', row.id)}
        columns={[
          { key: 'name', header: 'Cấu kiện', render: (row) => <strong className="text-amber-200">{row.name}</strong> },
          { key: 'yard', header: 'Yard', render: (row) => `${row.zone || 'A'}${numberValue(row.position_y) + 1} · L${numberValue(row.layer) || 1}` },
          { key: 'qty', header: 'Tồn', align: 'right', render: (row) => `${formatNumber(row.qty, 3)} ${row.unit || ''}` },
          { key: 'cost', header: 'Đơn giá', align: 'right', render: (row) => formatMoney(row.cost) },
          { key: 'value', header: 'Giá trị', align: 'right', render: (row) => formatMoney(numberValue(row.qty) * numberValue(row.cost)) },
          { key: 'weight', header: 'Tải / CK', align: 'right', render: (row) => `${formatNumber(row.weight)} kg` },
          {
            key: 'actions',
            header: 'Thao tác',
            align: 'right',
            render: (row) => (
              <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                <button className="rounded-lg border border-cyan-400/10 px-3 py-1 text-xs font-black text-slate-300" onClick={() => openEdit(row)}>Sửa</button>
                <button className="rounded-lg border border-emerald-400/20 px-3 py-1 text-xs font-black text-emerald-300" onClick={() => openOperation('produce', row)}>SX</button>
                <button className="rounded-lg border border-blue-400/20 px-3 py-1 text-xs font-black text-blue-300" onClick={() => openOperation('export', row)}>Xuất</button>
                <button className="rounded-lg border border-red-400/20 px-3 py-1 text-xs font-black text-red-300" onClick={() => remove(row)}>Xóa</button>
              </div>
            ),
          },
        ]}
      />

      <section className="mt-5 rounded-2xl border border-cyan-400/10 bg-[#061827] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Kho cấu kiện</p>
            <h2 className="mt-1 text-xl font-black text-white">Vật tư đã chuyển sang kho CK</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isLoadingWarehouse ? 'Đang tải tồn kho CK...' : `${formatNumber(structureWarehouse.length)} vật tư · ${formatMoney(warehouseValue)}`}
            </p>
          </div>
          <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white" onClick={() => openTransfer()}>+ Nhập từ kho chính</button>
        </div>
        {warehouseError ? (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">Không tải được kho cấu kiện.</div>
        ) : (
          <DataTable<StructureWarehouseItem>
            rows={structureWarehouse.slice(0, 80)}
            columns={[
              { key: 'material_name', header: 'Vật tư', render: (row) => <button className="text-left font-black text-cyan-200 hover:text-white" onClick={() => setLogItem(row)}>{row.material_name}</button> },
              { key: 'cat', header: 'Nhóm', render: (row) => getMaterialMeta(data.materials, row.material_id)?.cat || '—' },
              { key: 'qty', header: 'Tồn CK', align: 'right', render: (row) => `${formatNumber(row.qty, 3)} ${row.unit || ''}` },
              { key: 'main', header: 'Tồn kho chính', align: 'right', render: (row) => {
                const material = getMaterialMeta(data.materials, row.material_id)
                return `${formatNumber(material?.qty, 3)} ${material?.unit || row.unit || ''}`
              } },
              { key: 'value', header: 'Giá trị CK', align: 'right', render: (row) => formatMoney(numberValue(row.qty) * numberValue(row.cost)) },
              { key: 'status', header: 'TT', render: (row) => numberValue(row.qty) <= 5 ? <span className="rounded-full bg-amber-500/15 px-2 py-1 text-xs font-black text-amber-200">Sắp hết</span> : <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-black text-emerald-200">OK</span> },
              {
                key: 'actions',
                header: 'Thao tác',
                align: 'right',
                render: (row) => (
                  <div className="flex justify-end gap-2">
                    <button className="rounded-lg border border-cyan-400/10 px-3 py-1 text-xs font-black text-slate-300" onClick={() => setLogItem(row)}>Lịch sử</button>
                    <button className="rounded-lg border border-amber-400/20 px-3 py-1 text-xs font-black text-amber-300" onClick={() => openReturn(row)}>Trả lại</button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </section>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-5">
          <h2 className="mb-4 text-lg font-black text-white">Mức sẵn sàng sản xuất</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-400/10 bg-emerald-500/8 p-3"><small className="text-slate-500">Có BOM</small><strong className="block text-2xl text-emerald-200">{formatNumber(structuresWithBom)}</strong></div>
            <div className="rounded-xl border border-amber-400/10 bg-amber-500/8 p-3"><small className="text-slate-500">Thiếu BOM</small><strong className="block text-2xl text-amber-200">{formatNumber(structuresWithoutBom)}</strong></div>
            <div className="rounded-xl border border-blue-400/10 bg-blue-500/8 p-3"><small className="text-slate-500">Layer cao</small><strong className="block text-2xl text-blue-200">{formatNumber(highLayerCount)}</strong></div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Cấu kiện có BOM có thể đưa vào lệnh sản xuất nếu kho CK đủ vật tư. Cấu kiện thiếu BOM cần cập nhật định mức trước khi sản xuất.
          </p>
        </section>
        <section className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-5">
          <h2 className="mb-4 text-lg font-black text-white">BOM đang dùng nhiều nhất</h2>
          <div className="space-y-3">
            {[...structures]
              .sort((a, b) => (b.materials?.length || 0) - (a.materials?.length || 0))
              .slice(0, 6)
              .map((structure) => (
                <div className="rounded-xl border border-cyan-400/10 bg-slate-950/35 p-3" key={structure.id}>
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-slate-100">{structure.name}</strong>
                    <span className="text-xs font-black text-cyan-200">{formatNumber(structure.materials?.length || 0)} vật tư</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Tồn: {formatNumber(structure.qty, 3)} {structure.unit || ''} · Yard {structure.zone || 'A'}{numberValue(structure.position_y) + 1}</p>
                </div>
              ))}
          </div>
        </section>
      </div>
      {draft ? (
        <Modal
          title={structures.some((row) => row.id === draft.id) ? 'Sửa cấu kiện' : 'Thêm cấu kiện'}
          onClose={() => setDraft(null)}
          footer={(
            <>
              <button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => setDraft(null)}>Hủy</button>
              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={saving || !draft.name.trim()} onClick={submit}>Lưu</button>
            </>
          )}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Tên cấu kiện" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
            <FormField label="Loại" value={draft.type} onChange={(type) => setDraft({ ...draft, type })} />
            <FormField label="Đơn vị" value={draft.unit} onChange={(unit) => setDraft({ ...draft, unit })} />
            <FormField label="Tồn kho" type="number" value={draft.qty} onChange={(qty) => setDraft({ ...draft, qty })} />
            <FormField label="Đơn giá" type="number" value={draft.cost} onChange={(cost) => setDraft({ ...draft, cost })} />
            <FormField label="Khu yard" value={draft.zone} onChange={(zone) => setDraft({ ...draft, zone: zone.toUpperCase().slice(0, 1) })} />
            <FormField label="Dòng yard" type="number" value={draft.position_y} onChange={(position_y) => setDraft({ ...draft, position_y })} />
            <FormField label="Layer" type="number" value={draft.layer} onChange={(layer) => setDraft({ ...draft, layer })} />
            <FormField label="Tải / cấu kiện (kg)" type="number" value={draft.weight} onChange={(weight) => setDraft({ ...draft, weight })} />
            <FormField label="Ghi chú" value={draft.note} onChange={(note) => setDraft({ ...draft, note })} />
          </div>
          <div className="mt-4 rounded-2xl border border-cyan-400/10 bg-slate-950/45 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">BOM vật tư</p>
                <p className="mt-1 text-xs text-slate-500">Sản xuất cấu kiện sẽ trừ vật tư từ kho cấu kiện theo BOM này.</p>
              </div>
              <button
                className="rounded-lg border border-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200"
                onClick={() => setDraft({ ...draft, bomRows: [...draft.bomRows, { materialId: structureWarehouse[0]?.material_id || availableMaterials[0]?.id || '', quantity: '1' }] })}
              >
                + Thêm BOM
              </button>
            </div>
            <div className="space-y-2">
              {draft.bomRows.length === 0 ? (
                <div className="rounded-xl border border-amber-400/15 bg-amber-400/8 p-3 text-xs leading-5 text-amber-100">
                  Cấu kiện chưa có BOM. Có thể lưu trước, nhưng khi sản xuất backend sẽ yêu cầu BOM hợp lệ.
                </div>
              ) : draft.bomRows.map((row, index) => {
                const warehouseItem = structureWarehouse.find((item) => item.material_id === row.materialId)
                const material = getMaterialMeta(data.materials, row.materialId)
                const unit = warehouseItem?.unit || material?.unit || ''
                return (
                  <div className="grid gap-2 md:grid-cols-[1fr_120px_42px]" key={`${row.materialId}-${index}`}>
                    <SelectField
                      label={index === 0 ? 'Vật tư kho CK' : ''}
                      value={row.materialId}
                      onChange={(materialId) => setDraft({
                        ...draft,
                        bomRows: draft.bomRows.map((item, itemIndex) => itemIndex === index ? { ...item, materialId } : item),
                      })}
                      options={(structureWarehouse.length ? structureWarehouse : availableMaterials).map((item) => {
                        const materialId = 'material_id' in item ? item.material_id : item.id
                        const name = 'material_name' in item ? item.material_name : item.name
                        return { value: materialId, label: `${name} (${formatNumber(item.qty, 3)} ${item.unit || ''})` }
                      })}
                    />
                    <FormField
                      label={index === 0 ? `Định mức/${draft.unit || 'CK'}` : ''}
                      type="number"
                      value={row.quantity}
                      onChange={(quantity) => setDraft({
                        ...draft,
                        bomRows: draft.bomRows.map((item, itemIndex) => itemIndex === index ? { ...item, quantity } : item),
                      })}
                    />
                    <button
                      className="mt-auto h-[42px] rounded-xl border border-red-400/20 text-sm font-black text-red-300"
                      onClick={() => setDraft({ ...draft, bomRows: draft.bomRows.filter((_, itemIndex) => itemIndex !== index) })}
                    >
                      ×
                    </button>
                    <div className="md:col-span-3 text-xs text-slate-500">
                      Tồn CK: {warehouseItem ? `${formatNumber(warehouseItem.qty, 3)} ${unit}` : 'chưa chuyển kho CK'} · Giá trị định mức: {formatMoney(numberValue(row.quantity) * numberValue(warehouseItem?.cost ?? material?.cost))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Modal>
      ) : null}
      {operationDraft ? (
        <Modal
          title={operationDraft.type === 'produce' ? 'Sản xuất cấu kiện' : operationDraft.type === 'export' ? 'Xuất cấu kiện ra công trình' : 'Trả cấu kiện về kho'}
          onClose={() => setOperationDraft(null)}
          footer={(
            <>
              <button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => setOperationDraft(null)}>Hủy</button>
              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={saving || !operationDraft.structureId || numberValue(operationDraft.quantity) <= 0} onClick={submitOperation}>Xác nhận</button>
            </>
          )}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Cấu kiện"
              value={operationDraft.structureId}
              onChange={(structureId) => setOperationDraft({ ...operationDraft, structureId })}
              options={structures.map((structure) => ({ value: structure.id, label: `${structure.name} (${formatNumber(structure.qty, 3)} ${structure.unit || ''})` }))}
            />
            {operationDraft.type !== 'produce' ? (
              <SelectField label="Công trình" value={operationDraft.projectId} onChange={(projectId) => setOperationDraft({ ...operationDraft, projectId })} options={data.projects.map((project) => ({ value: project.id, label: project.name }))} />
            ) : null}
            <FormField label="Số lượng" type="number" value={operationDraft.quantity} onChange={(quantity) => setOperationDraft({ ...operationDraft, quantity })} />
            <FormField label="Ghi chú" value={operationDraft.note} onChange={(note) => setOperationDraft({ ...operationDraft, note })} />
          </div>
          <div className="mt-4">
            <FileUploader
              type={operationDraft.type === 'produce' ? 'produce' : operationDraft.type === 'export' ? 'structure_export' : 'structure_return'}
              files={operationDraft.files}
              onChange={(files) => setOperationDraft({ ...operationDraft, files })}
            />
          </div>
          <p className="mt-4 rounded-xl border border-cyan-400/10 bg-slate-950/45 p-3 text-xs leading-5 text-slate-300">
            Sản xuất sẽ trừ vật tư trong kho cấu kiện theo BOM. Xuất/trả cấu kiện sẽ cập nhật tồn cấu kiện và ngân sách công trình bằng backend cũ.
          </p>
        </Modal>
      ) : null}
      {transferDraft ? (
        <Modal
          title="Chuyển vật tư sang kho cấu kiện"
          onClose={() => setTransferDraft(null)}
          footer={(
            <>
              <button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => setTransferDraft(null)}>Hủy</button>
              <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={saving || transferDraft.rows.length === 0} onClick={submitTransfer}>Xác nhận chuyển</button>
            </>
          )}
        >
          <div className="grid gap-4">
            <FormField label="Thời gian nhập kho CK" type="datetime-local" value={transferDraft.datetime} onChange={(datetime) => setTransferDraft({ ...transferDraft, datetime })} />
            <div className="rounded-2xl border border-cyan-400/10 bg-slate-950/45 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Danh sách vật tư</span>
                <button
                  className="rounded-lg border border-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200"
                  onClick={() => setTransferDraft({ ...transferDraft, rows: [...transferDraft.rows, { materialId: availableMaterials[0]?.id || '', qty: '1' }] })}
                >
                  + Thêm dòng
                </button>
              </div>
              <div className="space-y-2">
                {transferDraft.rows.map((row, index) => {
                  const material = getMaterialMeta(data.materials, row.materialId)
                  const qty = numberValue(row.qty)
                  const overStock = material ? qty > numberValue(material.qty) : false
                  return (
                    <div className="grid gap-2 md:grid-cols-[1fr_120px_42px]" key={`${row.materialId}-${index}`}>
                      <SelectField
                        label={index === 0 ? 'Vật tư' : ''}
                        value={row.materialId}
                        onChange={(materialId) => setTransferDraft({
                          ...transferDraft,
                          rows: transferDraft.rows.map((item, itemIndex) => itemIndex === index ? { ...item, materialId } : item),
                        })}
                        options={availableMaterials.map((item) => ({ value: item.id, label: `${item.name} (${formatNumber(item.qty, 3)} ${item.unit || ''})` }))}
                      />
                      <FormField
                        label={index === 0 ? 'Số lượng' : ''}
                        type="number"
                        value={row.qty}
                        onChange={(qtyValue) => setTransferDraft({
                          ...transferDraft,
                          rows: transferDraft.rows.map((item, itemIndex) => itemIndex === index ? { ...item, qty: qtyValue } : item),
                        })}
                      />
                      <button
                        className="mt-auto h-[42px] rounded-xl border border-red-400/20 text-sm font-black text-red-300 disabled:opacity-40"
                        disabled={transferDraft.rows.length === 1}
                        onClick={() => setTransferDraft({ ...transferDraft, rows: transferDraft.rows.filter((_, itemIndex) => itemIndex !== index) })}
                      >
                        ×
                      </button>
                      <div className={`md:col-span-3 text-xs ${overStock ? 'text-red-200' : 'text-slate-500'}`}>
                        {material ? `Tồn kho chính: ${formatNumber(material.qty, 3)} ${material.unit || ''} · Giá trị chuyển: ${formatMoney(qty * numberValue(material.cost))}` : 'Chọn vật tư'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <FileUploader type="transfer_sw" files={transferDraft.files} onChange={(files) => setTransferDraft({ ...transferDraft, files })} />
            <FormField label="Ghi chú" value={transferDraft.note} onChange={(note) => setTransferDraft({ ...transferDraft, note })} />
          </div>
        </Modal>
      ) : null}
      {returnDraft ? (
        <Modal
          title="Trả vật tư từ kho CK về kho chính"
          onClose={() => setReturnDraft(null)}
          footer={(
            <>
              <button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => setReturnDraft(null)}>Hủy</button>
              <button className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={saving || numberValue(returnDraft.qty) <= 0} onClick={submitReturn}>Xác nhận trả</button>
            </>
          )}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Thời gian trả" type="datetime-local" value={returnDraft.datetime} onChange={(datetime) => setReturnDraft({ ...returnDraft, datetime })} />
            <FormField label="Số lượng trả" type="number" value={returnDraft.qty} onChange={(qty) => setReturnDraft({ ...returnDraft, qty })} />
            <div className="rounded-xl border border-cyan-400/10 bg-slate-950/45 p-3 text-sm text-slate-300">
              <span className="block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Tối đa</span>
              <strong className="mt-1 block text-lg text-white">{formatNumber(returnDraft.maxQty, 3)}</strong>
            </div>
            <FormField label="Ghi chú" value={returnDraft.note} onChange={(note) => setReturnDraft({ ...returnDraft, note })} />
          </div>
        </Modal>
      ) : null}
      {logItem ? (
        <Modal
          title={`Lịch sử kho CK: ${logItem.material_name}`}
          onClose={() => setLogItem(null)}
          footer={<button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => setLogItem(null)}>Đóng</button>}
        >
          {swLogsQuery.isLoading ? (
            <div className="rounded-xl border border-cyan-400/10 bg-slate-950/45 p-4 text-sm text-slate-400">Đang tải lịch sử...</div>
          ) : swLogsQuery.error ? (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">Không tải được lịch sử.</div>
          ) : (
            <DataTable
              rows={(swLogsQuery.data || []).slice(0, 50)}
              columns={[
                { key: 'created_at', header: 'Thời gian', render: (row) => formatDateTime(row.created_at) },
                { key: 'type', header: 'Loại', render: (row) => row.type === 'return_to_main' ? <span className="font-black text-amber-200">Trả kho chính</span> : <span className="font-black text-cyan-200">Chuyển kho CK</span> },
                { key: 'qty', header: 'Số lượng', align: 'right', render: (row) => `${row.type === 'return_to_main' ? '-' : '+'}${formatNumber(Math.abs(numberValue(row.qty)), 3)} ${row.unit || ''}` },
                { key: 'cost', header: 'Đơn giá', align: 'right', render: (row) => formatMoney(row.cost) },
                { key: 'note', header: 'Ghi chú', render: (row) => row.note || '—' },
                {
                  key: 'files',
                  header: 'File',
                  render: (row) => {
                    const files = parseAttachment(row.attachment)
                    return files.length ? (
                      <div className="flex flex-col gap-1">
                        {files.map((file) => <a className="text-xs font-bold text-blue-300 hover:text-white" href={file.path} target="_blank" rel="noreferrer" key={`${file.path}-${file.name}`}>{file.name}</a>)}
                      </div>
                    ) : '—'
                  },
                },
              ]}
            />
          )}
        </Modal>
      ) : null}
    </>
  )
}

export default ComponentsPage
