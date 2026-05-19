import { useState } from 'react'
import { buildImportPreview, downloadTemplate, readWorkbookRows, type ImportPreview, type ImportType } from '../services/excel'
import type { Material, Project, SteelTrackData, Supplier } from '../services/api'
import Modal from './Modal'

type ImportPayload = Material | Project | Supplier

type Props = {
  type: ImportType
  data: SteelTrackData
  saving?: boolean
  onClose: () => void
  onCommit: (rows: ImportPayload[]) => Promise<void>
}

const titles = {
  materials: 'Import danh sách vật tư',
  projects: 'Import danh sách công trình',
  suppliers: 'Import danh sách nhà cung cấp',
}

const formats = {
  materials: 'Tên vật tư, Loại, Đơn vị, Số lượng, Đơn giá, Ngưỡng cảnh báo, Ghi chú',
  projects: 'Tên công trình, Ngân sách',
  suppliers: 'Tên nhà cung cấp, SĐT, Email, Địa chỉ',
}

const mainText = (type: ImportType, payload: ImportPayload | null) => {
  if (!payload) return '—'
  if (type === 'materials') {
    const item = payload as Material
    return `${item.name} · ${item.cat || '—'} · ${item.qty || 0} ${item.unit || ''}`
  }
  if (type === 'projects') {
    const item = payload as Project
    return `${item.name} · ${Number(item.budget || 0).toLocaleString('vi-VN')} đ`
  }
  const item = payload as Supplier
  return `${item.name} · ${item.phone || '—'} · ${item.email || '—'}`
}

const ExcelImportModal = ({ type, data, saving, onClose, onCommit }: Props) => {
  const [preview, setPreview] = useState<ImportPreview<ImportPayload> | null>(null)
  const [reading, setReading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file?: File) => {
    setPreview(null)
    setError('')
    if (!file) return
    setReading(true)
    try {
      const rows = await readWorkbookRows(file)
      setPreview(buildImportPreview(type, rows, data) as ImportPreview<ImportPayload>)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được file Excel')
    } finally {
      setReading(false)
    }
  }

  return (
    <Modal
      title={titles[type]}
      onClose={onClose}
      footer={(
        <>
          <button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={onClose}>Hủy</button>
          <button
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
            disabled={saving || !preview || preview.validRows.length === 0}
            onClick={() => preview && onCommit(preview.validRows.map((row) => row.payload).filter(Boolean) as ImportPayload[])}
          >
            Import {preview?.validRows.length || 0} dòng
          </button>
        </>
      )}
    >
      <div className="rounded-2xl border border-cyan-400/10 bg-slate-950/45 p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Định dạng file Excel</p>
        <p className="mt-2 text-sm text-slate-300">{formats[type]}</p>
        <button className="mt-3 rounded-lg border border-cyan-400/10 px-3 py-2 text-xs font-black text-blue-300" onClick={() => downloadTemplate(type)}>
          Tải file mẫu
        </button>
      </div>
      <label className="mt-4 block rounded-2xl border border-dashed border-cyan-400/20 bg-slate-950/35 p-4 text-sm text-slate-300">
        <span className="block font-black text-white">Chọn file .xlsx hoặc .xls</span>
        <input className="mt-3 w-full text-sm" type="file" accept=".xlsx,.xls" onChange={(event) => handleFile(event.target.files?.[0])} />
      </label>
      {reading ? <div className="mt-4 rounded-xl border border-cyan-400/10 bg-blue-500/10 p-3 text-sm font-bold text-blue-200">Đang đọc và kiểm tra file...</div> : null}
      {error ? <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</div> : null}
      {preview ? (
        <div className="mt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-slate-950/45 p-3"><small className="text-slate-500">Tổng dòng</small><strong className="block text-lg text-white">{preview.total}</strong></div>
            <div className="rounded-xl bg-slate-950/45 p-3"><small className="text-slate-500">Có thể import</small><strong className="block text-lg text-emerald-200">{preview.validRows.length}</strong></div>
            <div className="rounded-xl bg-slate-950/45 p-3"><small className="text-slate-500">Cảnh báo</small><strong className="block text-lg text-amber-200">{preview.warningRows.length}</strong></div>
            <div className="rounded-xl bg-slate-950/45 p-3"><small className="text-slate-500">Lỗi</small><strong className="block text-lg text-red-200">{preview.errorRows.length}</strong></div>
          </div>
          <div className="mt-4 max-h-[360px] overflow-auto rounded-2xl border border-cyan-400/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr><th className="p-3">Dòng</th><th className="p-3">TT</th><th className="p-3">Dữ liệu</th><th className="p-3">Ghi chú</th></tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 40).map((row) => (
                  <tr className="border-t border-cyan-400/10" key={row.rowNumber}>
                    <td className="p-3 text-slate-400">{row.rowNumber}</td>
                    <td className="p-3 font-black">{row.status === 'error' ? <span className="text-red-300">Lỗi</span> : row.status === 'warning' ? <span className="text-amber-200">Cảnh báo</span> : <span className="text-emerald-200">OK</span>}</td>
                    <td className="p-3 text-slate-200">{mainText(type, row.payload)}</td>
                    <td className="p-3 text-slate-500">{[...row.errors, ...row.warnings].join(' · ') || 'Sẵn sàng import'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

export default ExcelImportModal
