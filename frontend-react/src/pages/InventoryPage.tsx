import { Plus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { deleteMaterial, formatMoney, formatNumber, makeId, moveUploadedFiles, numberValue, saveMaterial, saveMaterialTransaction, type Material, type UploadedFile } from '../services/api'
import { useSteelTrackData } from '../services/useSteelTrackData'
import DataState from '../shared/DataState'
import DataTable from '../shared/DataTable'
import FileUploader from '../shared/FileUploader'
import FormField from '../shared/FormField'
import Modal from '../shared/Modal'
import PageHeader from '../shared/PageHeader'
import SelectField from '../shared/SelectField'
import { useUiStore } from '../stores/uiStore'
import ExcelImportModal from '../shared/ExcelImportModal'
import { exportWorkbook } from '../services/excel'

type MaterialDraft = {
  id: string
  name: string
  cat: string
  unit: string
  qty: string
  cost: string
  low: string
  note: string
}

type TxnDraft = {
  mid: string
  type: 'purchase' | 'usage' | 'return'
  qty: string
  unitPrice: string
  vatRate: string
  supplierId: string
  projectId: string
  note: string
  files: UploadedFile[]
}

const emptyMaterial = (): MaterialDraft => ({
  id: makeId('M'),
  name: '',
  cat: '',
  unit: 'tấn',
  qty: '0',
  cost: '0',
  low: '0',
  note: '',
})

const InventoryPage = () => {
  const { data, isLoading, error } = useSteelTrackData()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'low' | 'ok'>('all')
  const [draft, setDraft] = useState<MaterialDraft | null>(null)
  const [txnDraft, setTxnDraft] = useState<TxnDraft | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const queryClient = useQueryClient()
  const selectEntity = useUiStore((state) => state.selectEntity)
  const materials = useMemo(() => data?.materials ?? [], [data?.materials])

  const rows = useMemo(() => {
    const text = query.trim().toLowerCase()
    return [...materials]
      .filter((material) => {
        const isLow = numberValue(material.qty) <= numberValue(material.low)
        if (status === 'low' && !isLow) return false
        if (status === 'ok' && isLow) return false
        if (!text) return true
        return `${material.name} ${material.id} ${material.cat || ''}`.toLowerCase().includes(text)
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      .slice(0, 80)
  }, [materials, query, status])

  if (isLoading || error || !data) return <DataState isLoading={isLoading} error={error} />

  const lowCount = materials.filter((material) => numberValue(material.qty) <= numberValue(material.low)).length
  const openEdit = (material: Material) => setDraft({
    id: material.id,
    name: material.name,
    cat: material.cat || '',
    unit: material.unit || 'tấn',
    qty: String(material.qty || 0),
    cost: String(material.cost || 0),
    low: String(material.low || 0),
    note: material.note || '',
  })
  const submit = async () => {
    if (!draft?.name.trim()) return
    setSaving(true)
    setNotice(null)
    try {
      await saveMaterial({
        id: draft.id,
        name: draft.name,
        cat: draft.cat,
        unit: draft.unit,
        qty: numberValue(draft.qty),
        cost: numberValue(draft.cost),
        low: numberValue(draft.low),
        note: draft.note,
      })
      await queryClient.invalidateQueries({ queryKey: ['steeltrack-data'] })
      setDraft(null)
      setNotice({ type: 'success', text: 'Đã lưu vật tư.' })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Không lưu được vật tư' })
    } finally {
      setSaving(false)
    }
  }
  const remove = async (material: Material) => {
    if (!window.confirm(`Xóa vật tư "${material.name}"?`)) return
    setNotice(null)
    try {
      await deleteMaterial(material.id)
      await queryClient.invalidateQueries({ queryKey: ['steeltrack-data'] })
      setNotice({ type: 'success', text: 'Đã xóa vật tư.' })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Không xóa được vật tư' })
    }
  }
  const openTxn = (type: TxnDraft['type'], material?: Material) => setTxnDraft({
    mid: material?.id || rows[0]?.id || '',
    type,
    qty: '1',
    unitPrice: String(material?.cost || rows[0]?.cost || 0),
    vatRate: '0',
    supplierId: data.suppliers[0]?.id || '',
    projectId: data.projects[0]?.id || '',
    note: '',
    files: [],
  })
  const submitTxn = async () => {
    if (!txnDraft?.mid || numberValue(txnDraft.qty) <= 0) return
    const selectedMaterial = materials.find((material) => material.id === txnDraft.mid)
    const qty = numberValue(txnDraft.qty)
    if (!selectedMaterial) {
      setNotice({ type: 'error', text: 'Chưa chọn vật tư hợp lệ.' })
      return
    }
    if (txnDraft.type === 'usage' && qty > numberValue(selectedMaterial.qty)) {
      setNotice({ type: 'error', text: `Không đủ tồn để xuất ${selectedMaterial.name}. Tồn hiện tại: ${formatNumber(selectedMaterial.qty, 3)} ${selectedMaterial.unit || ''}.` })
      return
    }
    setSaving(true)
    setNotice(null)
    try {
      const finalFiles = await moveUploadedFiles(txnDraft.files, txnDraft.type)
      await saveMaterialTransaction({
        mid: txnDraft.mid,
        type: txnDraft.type,
        qty,
        unitPrice: numberValue(txnDraft.unitPrice),
        vatRate: numberValue(txnDraft.vatRate),
        supplierId: txnDraft.type === 'purchase' ? txnDraft.supplierId : '',
        projectId: txnDraft.type !== 'purchase' ? txnDraft.projectId : '',
        note: txnDraft.note,
        attachment: JSON.stringify(finalFiles),
      })
      await queryClient.invalidateQueries({ queryKey: ['steeltrack-data'] })
      setTxnDraft(null)
      setNotice({ type: 'success', text: 'Đã ghi nhận giao dịch kho.' })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Không lưu được giao dịch kho' })
    } finally {
      setSaving(false)
    }
  }
  const importMaterials = async (items: Material[]) => {
    setSaving(true)
    setNotice(null)
    try {
      for (const item of items) await saveMaterial(item)
      await queryClient.invalidateQueries({ queryKey: ['steeltrack-data'] })
      setImportOpen(false)
      setNotice({ type: 'success', text: `Đã import ${formatNumber(items.length)} vật tư.` })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Import vật tư thất bại' })
    } finally {
      setSaving(false)
    }
  }
  const exportMaterials = async () => {
    setNotice(null)
    try {
      await exportWorkbook(
        `danh_sach_vat_tu_${new Date().toISOString().slice(0, 10)}.xlsx`,
        'Vật tư',
        materials.map((material) => ({
          'Mã vật tư': material.id,
          'Tên vật tư': material.name,
          Loại: material.cat || '',
          'Đơn vị': material.unit || '',
          'Tồn kho': numberValue(material.qty),
          'Đơn giá': numberValue(material.cost),
          'Ngưỡng cảnh báo': numberValue(material.low),
          'Tổng giá trị': numberValue(material.qty) * numberValue(material.cost),
          'Ghi chú': material.note || '',
        })),
      )
      setNotice({ type: 'success', text: 'Đã xuất Excel danh sách vật tư.' })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Xuất Excel thất bại' })
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Kho vật tư"
        description={`Đang quản lý ${rows.length}/${materials.length} vật tư với nhập, xuất, trả hàng, import/export Excel và file đính kèm.`}
        actions={(
          <>
            <button className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-200" onClick={() => openTxn('purchase')}>Nhập kho</button>
            <button className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-200" onClick={() => openTxn('usage')}>Xuất kho</button>
            <button className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm font-black text-amber-200" onClick={() => openTxn('return')}>Trả hàng</button>
            <button className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-black text-cyan-200" onClick={() => setImportOpen(true)}>Import Excel</button>
            <button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={exportMaterials}>Export Excel</button>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white" onClick={() => setDraft(emptyMaterial())}><Plus className="mr-2 inline h-4 w-4" />Thêm vật tư</button>
          </>
        )}
      />

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4"><small className="text-slate-500">Tổng vật tư</small><strong className="block text-2xl text-white">{formatNumber(materials.length)}</strong></div>
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4"><small className="text-slate-500">Sắp hết</small><strong className="block text-2xl text-red-300">{formatNumber(lowCount)}</strong></div>
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4"><small className="text-slate-500">Tổng giá trị</small><strong className="block text-2xl text-blue-200">{formatMoney(materials.reduce((sum, item) => sum + numberValue(item.qty) * numberValue(item.cost), 0))}</strong></div>
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
          placeholder="Tìm tên, mã, nhóm vật tư..."
          className="min-w-[260px] flex-1 rounded-xl border border-cyan-400/10 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-400/45"
        />
        {[
          ['all', 'Tất cả'],
          ['low', 'Sắp hết'],
          ['ok', 'OK'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatus(key as typeof status)}
            className={`rounded-xl border px-4 py-2 text-sm font-black ${status === key ? 'border-blue-400/40 bg-blue-500/20 text-white' : 'border-cyan-400/10 text-slate-400'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <DataTable<Material>
        rows={rows}
        onRowClick={(row) => selectEntity('material', row.id)}
        columns={[
          { key: 'stt', header: 'STT', align: 'center', render: (_row, index) => index + 1 },
          { key: 'name', header: 'Tên vật tư', render: (row) => <strong className="text-blue-300">{row.name}</strong> },
          { key: 'cat', header: 'Nhóm', render: (row) => row.cat || '—' },
          { key: 'qty', header: 'Tồn kho', align: 'right', render: (row) => `${formatNumber(row.qty, 3)} ${row.unit || ''}` },
          { key: 'low', header: 'Ngưỡng', align: 'right', render: (row) => `${formatNumber(row.low, 3)} ${row.unit || ''}` },
          { key: 'cost', header: 'Đơn giá', align: 'right', render: (row) => formatMoney(row.cost) },
          { key: 'value', header: 'Tổng giá trị', align: 'right', render: (row) => formatMoney(numberValue(row.qty) * numberValue(row.cost)) },
          {
            key: 'status',
            header: 'TT',
            align: 'center',
            render: (row) => (
              <span className={`rounded-full px-2 py-1 text-xs font-black ${numberValue(row.qty) <= numberValue(row.low) ? 'bg-amber-400/15 text-amber-300' : 'bg-emerald-400/15 text-emerald-300'}`}>
                {numberValue(row.qty) <= numberValue(row.low) ? 'Sắp hết' : 'OK'}
              </span>
            ),
          },
          {
            key: 'actions',
            header: 'Thao tác',
            align: 'right',
            render: (row) => (
              <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                <button className="rounded-lg border border-cyan-400/10 px-3 py-1 text-xs font-black text-slate-300" onClick={() => openEdit(row)}>Sửa</button>
                <button className="rounded-lg border border-emerald-400/20 px-3 py-1 text-xs font-black text-emerald-300" onClick={() => openTxn('purchase', row)}>Nhập</button>
                <button className="rounded-lg border border-blue-400/20 px-3 py-1 text-xs font-black text-blue-300" onClick={() => openTxn('usage', row)}>Xuất</button>
                <button className="rounded-lg border border-red-400/20 px-3 py-1 text-xs font-black text-red-300" onClick={() => remove(row)}>Xóa</button>
              </div>
            ),
          },
        ]}
      />
      {draft ? (
        <Modal
          title={materials.some((row) => row.id === draft.id) ? 'Sửa vật tư' : 'Thêm vật tư'}
          onClose={() => setDraft(null)}
          footer={(
            <>
              <button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => setDraft(null)}>Hủy</button>
              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={saving || !draft.name.trim()} onClick={submit}>Lưu</button>
            </>
          )}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Tên vật tư" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
            <FormField label="Nhóm" value={draft.cat} onChange={(cat) => setDraft({ ...draft, cat })} />
            <FormField label="Đơn vị" value={draft.unit} onChange={(unit) => setDraft({ ...draft, unit })} />
            <FormField label="Tồn kho" type="number" value={draft.qty} onChange={(qty) => setDraft({ ...draft, qty })} />
            <FormField label="Đơn giá" type="number" value={draft.cost} onChange={(cost) => setDraft({ ...draft, cost })} />
            <FormField label="Ngưỡng cảnh báo" type="number" value={draft.low} onChange={(low) => setDraft({ ...draft, low })} />
            <FormField label="Ghi chú" value={draft.note} onChange={(note) => setDraft({ ...draft, note })} />
          </div>
        </Modal>
      ) : null}
      {txnDraft ? (
        (() => {
          const selectedMaterial = materials.find((material) => material.id === txnDraft.mid)
          const qty = numberValue(txnDraft.qty)
          const currentStock = numberValue(selectedMaterial?.qty)
          const nextStock = txnDraft.type === 'purchase' || txnDraft.type === 'return' ? currentStock + qty : currentStock - qty
          const isOverStock = txnDraft.type === 'usage' && qty > currentStock
          return (
        <Modal
          title={txnDraft.type === 'purchase' ? 'Nhập kho' : txnDraft.type === 'usage' ? 'Xuất kho' : 'Trả hàng'}
          onClose={() => setTxnDraft(null)}
          footer={(
            <>
              <button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => setTxnDraft(null)}>Hủy</button>
              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={saving || !txnDraft.mid || numberValue(txnDraft.qty) <= 0 || isOverStock} onClick={submitTxn}>Xác nhận</button>
            </>
          )}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Vật tư"
              value={txnDraft.mid}
              onChange={(mid) => {
                const material = materials.find((item) => item.id === mid)
                setTxnDraft({ ...txnDraft, mid, unitPrice: String(material?.cost || txnDraft.unitPrice) })
              }}
              options={materials.map((material) => ({ value: material.id, label: `${material.name} (${formatNumber(material.qty, 3)} ${material.unit || ''})` }))}
            />
            {txnDraft.type === 'purchase' ? (
              <SelectField label="Nhà cung cấp" value={txnDraft.supplierId} onChange={(supplierId) => setTxnDraft({ ...txnDraft, supplierId })} options={data.suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))} />
            ) : (
              <SelectField label="Công trình" value={txnDraft.projectId} onChange={(projectId) => setTxnDraft({ ...txnDraft, projectId })} options={data.projects.map((project) => ({ value: project.id, label: project.name }))} />
            )}
            <FormField label="Số lượng" type="number" value={txnDraft.qty} onChange={(qty) => setTxnDraft({ ...txnDraft, qty })} />
            <FormField label="Đơn giá" type="number" value={txnDraft.unitPrice} onChange={(unitPrice) => setTxnDraft({ ...txnDraft, unitPrice })} />
            <FormField label="VAT (%)" type="number" value={txnDraft.vatRate} onChange={(vatRate) => setTxnDraft({ ...txnDraft, vatRate })} />
            <FormField label="Ghi chú" value={txnDraft.note} onChange={(note) => setTxnDraft({ ...txnDraft, note })} />
          </div>
          <div className="mt-4">
            <FileUploader type={txnDraft.type} files={txnDraft.files} onChange={(files) => setTxnDraft({ ...txnDraft, files })} />
          </div>
          <div className={`mt-4 rounded-xl border p-3 text-sm ${isOverStock ? 'border-red-400/20 bg-red-500/10 text-red-100' : 'border-cyan-400/10 bg-slate-950/45 text-slate-300'}`}>
            <div className="grid gap-3 md:grid-cols-3">
              <span>Tồn hiện tại: <strong className="text-white">{formatNumber(currentStock, 3)} {selectedMaterial?.unit || ''}</strong></span>
              <span>Tồn sau giao dịch: <strong className={nextStock < 0 ? 'text-red-200' : 'text-white'}>{formatNumber(nextStock, 3)} {selectedMaterial?.unit || ''}</strong></span>
              <span>Thành tiền: <strong className="text-white">{formatMoney(qty * numberValue(txnDraft.unitPrice) * (1 + numberValue(txnDraft.vatRate) / 100))}</strong></span>
            </div>
            {isOverStock ? <p className="mt-2 text-xs font-bold text-red-200">Số lượng xuất đang lớn hơn tồn kho hiện tại.</p> : null}
          </div>
        </Modal>
          )
        })()
      ) : null}
      {importOpen ? <ExcelImportModal type="materials" data={data} saving={saving} onClose={() => setImportOpen(false)} onCommit={(items) => importMaterials(items as Material[])} /> : null}
    </>
  )
}

export default InventoryPage
