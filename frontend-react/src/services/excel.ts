import { makeId, numberValue, type Material, type Project, type Supplier, type SteelTrackData } from './api'

export type ImportType = 'materials' | 'projects' | 'suppliers'

export type ImportPreviewRow<T> = {
  rowNumber: number
  status: 'ok' | 'warning' | 'error'
  errors: string[]
  warnings: string[]
  payload: T | null
}

export type ImportPreview<T> = {
  type: ImportType
  total: number
  rows: ImportPreviewRow<T>[]
  validRows: ImportPreviewRow<T>[]
  errorRows: ImportPreviewRow<T>[]
  warningRows: ImportPreviewRow<T>[]
}

type RawRow = Record<string, unknown>

const cell = (row: RawRow, keys: string[], fallback: unknown = '') => {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return fallback
}

const parseNumber = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const cleaned = String(value ?? '0').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  return numberValue(cleaned)
}

export const readWorkbookRows = async (file: File): Promise<RawRow[]> => {
  const { readSheet } = await import('read-excel-file/browser')
  const rows = await readSheet(file)
  const [headerRow, ...bodyRows] = rows
  const headers = (headerRow || []).map((header) => String(header || '').trim())
  return bodyRows.map((row) => {
    const objectRow: RawRow = {}
    headers.forEach((header, index) => {
      if (header) objectRow[header] = row[index]
    })
    return objectRow
  })
}

export const buildImportPreview = (type: ImportType, rows: RawRow[], data: SteelTrackData) => {
  const previewRows = rows.map((row, index) => {
    const rowNumber = index + 2
    const errors: string[] = []
    const warnings: string[] = []
    let payload: Material | Project | Supplier | null = null

    if (type === 'materials') {
      const name = String(cell(row, ['Tên vật tư', 'Tên', 'name', 'Name'])).trim()
      const cat = String(cell(row, ['Loại', 'Danh mục', 'category', 'cat'], 'Vật tư khác')).trim() || 'Vật tư khác'
      const unit = String(cell(row, ['Đơn vị', 'unit'], 'cái')).trim() || 'cái'
      const qty = parseNumber(cell(row, ['Số lượng', 'Tồn kho', 'qty'], 0))
      const cost = parseNumber(cell(row, ['Đơn giá', 'Giá', 'cost'], 0))
      const low = parseNumber(cell(row, ['Ngưỡng cảnh báo', 'low'], 5))
      const note = String(cell(row, ['Ghi chú', 'note'], '') || '')
      if (!name) errors.push('Thiếu tên vật tư')
      if (qty < 0) errors.push('Số lượng âm')
      if (cost < 0) errors.push('Đơn giá âm')
      if (low < 0) errors.push('Ngưỡng cảnh báo âm')
      if (data.materials.some((item) => String(item.name || '').toLowerCase() === name.toLowerCase())) warnings.push('Trùng tên vật tư hiện có')
      payload = { id: makeId('M'), name, cat, unit, qty, cost, low, note }
    }

    if (type === 'projects') {
      const name = String(cell(row, ['Tên công trình', 'Tên', 'name', 'Name'])).trim()
      const budget = parseNumber(cell(row, ['Ngân sách', 'budget'], 0))
      if (!name) errors.push('Thiếu tên công trình')
      if (budget < 0) errors.push('Ngân sách âm')
      if (data.projects.some((item) => String(item.name || '').toLowerCase() === name.toLowerCase())) errors.push('Công trình đã tồn tại')
      payload = { id: makeId('P'), name, budget, spent: 0 }
    }

    if (type === 'suppliers') {
      const name = String(cell(row, ['Tên nhà cung cấp', 'Tên', 'name', 'Name'])).trim()
      const phone = String(cell(row, ['SĐT', 'Điện thoại', 'phone'], '') || '')
      const email = String(cell(row, ['Email', 'email'], '') || '')
      const address = String(cell(row, ['Địa chỉ', 'address'], '') || '')
      if (!name) errors.push('Thiếu tên nhà cung cấp')
      if (data.suppliers.some((item) => String(item.name || '').toLowerCase() === name.toLowerCase())) errors.push('Nhà cung cấp đã tồn tại')
      payload = { id: makeId('S'), name, phone, email, address }
    }

    return {
      rowNumber,
      status: errors.length ? 'error' : warnings.length ? 'warning' : 'ok',
      errors,
      warnings,
      payload,
    }
  })

  return {
    type,
    total: previewRows.length,
    rows: previewRows,
    validRows: previewRows.filter((row) => row.status !== 'error'),
    errorRows: previewRows.filter((row) => row.status === 'error'),
    warningRows: previewRows.filter((row) => row.status === 'warning'),
  }
}

export const exportWorkbook = async (filename: string, sheetName: string, rows: Record<string, unknown>[]) => {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const headers = rows.length ? Object.keys(rows[0]) : ['Dữ liệu']
  const sheet = [
    headers.map((header) => ({ value: header, fontWeight: 'bold' as const })),
    ...rows.map((row) => headers.map((header) => {
      const value = row[header]
      return { value: value instanceof Date || typeof value === 'number' || typeof value === 'boolean' ? value : String(value ?? '') }
    })),
  ]
  await writeXlsxFile(sheet, { sheet: sheetName }).toFile(filename)
}

export const downloadTemplate = async (type: ImportType) => {
  const templates = {
    materials: {
      filename: 'template_import_vat_tu.xlsx',
      sheet: 'Vật tư',
      rows: [{ 'Tên vật tư': 'Thép tấm 10mm', 'Loại': 'Thép tấm', 'Đơn vị': 'tấn', 'Số lượng': 10, 'Đơn giá': 8500000, 'Ngưỡng cảnh báo': 5, 'Ghi chú': 'Thép chất lượng cao' }],
    },
    projects: {
      filename: 'template_import_cong_trinh.xlsx',
      sheet: 'Công trình',
      rows: [{ 'Tên công trình': 'Nhà xưởng ABC', 'Ngân sách': 5000000000 }],
    },
    suppliers: {
      filename: 'template_import_nha_cung_cap.xlsx',
      sheet: 'Nhà cung cấp',
      rows: [{ 'Tên nhà cung cấp': 'Công ty Thép ABC', 'SĐT': '0912345678', Email: 'contact@thepabc.com', 'Địa chỉ': 'TP.HCM' }],
    },
  }
  const template = templates[type]
  exportWorkbook(template.filename, template.sheet, template.rows)
}
