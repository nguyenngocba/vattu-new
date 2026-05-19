import { Mail, MapPin, Phone } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { deleteSupplier, formatNumber, makeId, saveSupplier, type Supplier } from '../services/api'
import { useSteelTrackData } from '../services/useSteelTrackData'
import DataState from '../shared/DataState'
import DataTable from '../shared/DataTable'
import FormField from '../shared/FormField'
import Modal from '../shared/Modal'
import PageHeader from '../shared/PageHeader'
import { useUiStore } from '../stores/uiStore'
import ExcelImportModal from '../shared/ExcelImportModal'
import { exportWorkbook } from '../services/excel'

type SupplierDraft = {
  id: string
  name: string
  phone: string
  email: string
  address: string
}

const emptySupplier = (): SupplierDraft => ({
  id: makeId('S'),
  name: '',
  phone: '',
  email: '',
  address: '',
})

const SuppliersPage = () => {
  const { data, isLoading, error } = useSteelTrackData()
  const selectEntity = useUiStore((state) => state.selectEntity)
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<SupplierDraft | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (isLoading || error || !data) return <DataState isLoading={isLoading} error={error} />

  const rows = [...data.suppliers].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  const openEdit = (supplier: Supplier) => setDraft({
    id: supplier.id,
    name: supplier.name,
    phone: supplier.phone || '',
    email: supplier.email || '',
    address: supplier.address || '',
  })
  const submit = async () => {
    if (!draft?.name.trim()) return
    setSaving(true)
    setNotice(null)
    try {
      await saveSupplier(draft)
      await queryClient.invalidateQueries({ queryKey: ['steeltrack-data'] })
      setDraft(null)
      setNotice({ type: 'success', text: 'Đã lưu nhà cung cấp.' })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Không lưu được nhà cung cấp' })
    } finally {
      setSaving(false)
    }
  }
  const remove = async (supplier: Supplier) => {
    if (!window.confirm(`Xóa nhà cung cấp "${supplier.name}"?`)) return
    setNotice(null)
    try {
      await deleteSupplier(supplier.id)
      await queryClient.invalidateQueries({ queryKey: ['steeltrack-data'] })
      setNotice({ type: 'success', text: 'Đã xóa nhà cung cấp.' })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Không xóa được nhà cung cấp' })
    }
  }
  const importSuppliers = async (items: Supplier[]) => {
    setSaving(true)
    setNotice(null)
    try {
      for (const item of items) await saveSupplier(item)
      await queryClient.invalidateQueries({ queryKey: ['steeltrack-data'] })
      setImportOpen(false)
      setNotice({ type: 'success', text: `Đã import ${formatNumber(items.length)} nhà cung cấp.` })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Import nhà cung cấp thất bại' })
    } finally {
      setSaving(false)
    }
  }
  const exportSuppliers = async () => {
    setNotice(null)
    try {
      await exportWorkbook(
        `danh_sach_nha_cung_cap_${new Date().toISOString().slice(0, 10)}.xlsx`,
        'Nhà cung cấp',
        data.suppliers.map((supplier) => ({
          'Mã NCC': supplier.id,
          'Tên nhà cung cấp': supplier.name,
          'SĐT': supplier.phone || '',
          Email: supplier.email || '',
          'Địa chỉ': supplier.address || '',
        })),
      )
      setNotice({ type: 'success', text: 'Đã xuất Excel nhà cung cấp.' })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Xuất Excel thất bại' })
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Suppliers"
        title="Nhà cung cấp"
        description="Quản lý nhà cung cấp, import/export Excel và xem lịch sử nhập hàng qua panel chi tiết."
        actions={(
          <>
            <button className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-black text-cyan-200" onClick={() => setImportOpen(true)}>Import Excel</button>
            <button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={exportSuppliers}>Export Excel</button>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white" onClick={() => setDraft(emptySupplier())}>+ Thêm NCC</button>
          </>
        )}
      />
      <DataTable<Supplier>
        rows={rows}
        onRowClick={(row) => selectEntity('supplier', row.id)}
        columns={[
          { key: 'name', header: 'Nhà cung cấp', render: (row) => <strong className="text-emerald-200">{row.name}</strong> },
          { key: 'phone', header: 'Điện thoại', render: (row) => <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-slate-500" />{row.phone || '—'}</span> },
          { key: 'email', header: 'Email', render: (row) => <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-slate-500" />{row.email || '—'}</span> },
          { key: 'address', header: 'Địa chỉ', render: (row) => <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-500" />{row.address || '—'}</span> },
          {
            key: 'actions',
            header: 'Thao tác',
            align: 'right',
            render: (row) => (
              <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                <button className="rounded-lg border border-cyan-400/10 px-3 py-1 text-xs font-black text-slate-300" onClick={() => openEdit(row)}>Sửa</button>
                <button className="rounded-lg border border-red-400/20 px-3 py-1 text-xs font-black text-red-300" onClick={() => remove(row)}>Xóa</button>
              </div>
            ),
          },
        ]}
      />
      {notice ? (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-bold ${notice.type === 'success' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-red-400/20 bg-red-500/10 text-red-200'}`}>
          {notice.text}
        </div>
      ) : null}
      {draft ? (
        <Modal
          title={rows.some((row) => row.id === draft.id) ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
          onClose={() => setDraft(null)}
          footer={(
            <>
              <button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => setDraft(null)}>Hủy</button>
              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={saving || !draft.name.trim()} onClick={submit}>Lưu</button>
            </>
          )}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Tên nhà cung cấp" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
            <FormField label="Điện thoại" value={draft.phone} onChange={(phone) => setDraft({ ...draft, phone })} />
            <FormField label="Email" value={draft.email} onChange={(email) => setDraft({ ...draft, email })} />
            <FormField label="Địa chỉ" value={draft.address} onChange={(address) => setDraft({ ...draft, address })} />
          </div>
        </Modal>
      ) : null}
      {importOpen ? <ExcelImportModal type="suppliers" data={data} saving={saving} onClose={() => setImportOpen(false)} onCommit={(items) => importSuppliers(items as Supplier[])} /> : null}
    </>
  )
}

export default SuppliersPage
