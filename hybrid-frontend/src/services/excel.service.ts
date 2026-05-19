import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export const excelService = {
  // Export functions
  exportMaterials: (materials: any[]) => {
    const data = materials.map((m: any) => ({
      'Mã': m.id,
      'Tên vật tư': m.name,
      'Loại': m.cat,
      'Đơn vị': m.unit,
      'Số lượng': m.qty,
      'Đơn giá': m.cost,
      'Thành tiền': m.qty * m.cost,
      'Ngưỡng cảnh báo': m.low,
      'Ghi chú': m.note || ''
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Vật tư')
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
    saveAs(blob, `danh_sach_vat_tu_${new Date().toISOString().split('T')[0]}.xlsx`)
  },

  exportProjects: (projects: any[]) => {
    const data = projects.map((p: any) => ({
      'Mã': p.id,
      'Tên công trình': p.name,
      'Ngân sách': p.budget,
      'Đã chi': p.spent,
      'Còn lại': Number(p.budget) - Number(p.spent),
      '% sử dụng': Number(p.budget) > 0 ? ((Number(p.spent) / Number(p.budget)) * 100).toFixed(1) : 0
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Công trình')
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
    saveAs(blob, `danh_sach_cong_trinh_${new Date().toISOString().split('T')[0]}.xlsx`)
  },

  exportSuppliers: (suppliers: any[]) => {
    const data = suppliers.map((s: any) => ({
      'Mã': s.id,
      'Tên nhà cung cấp': s.name,
      'SĐT': s.phone || '',
      'Email': s.email || '',
      'Địa chỉ': s.address || ''
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Nhà cung cấp')
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
    saveAs(blob, `danh_sach_nha_cung_cap_${new Date().toISOString().split('T')[0]}.xlsx`)
  },

  exportStructures: (structures: any[]) => {
    const data = structures.map((s: any) => ({
      'Mã': s.id,
      'Tên cấu kiện': s.name,
      'Số lượng': s.qty,
      'Đơn vị': s.unit || 'cái',
      'Đơn giá': s.cost,
      'Thành tiền': s.qty * s.cost
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Cấu kiện')
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
    saveAs(blob, `danh_sach_cau_kien_${new Date().toISOString().split('T')[0]}.xlsx`)
  },

  // Import functions
  importMaterials: (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Không thể đọc file'))
      reader.readAsArrayBuffer(file)
    })
  },

  importProjects: (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Không thể đọc file'))
      reader.readAsArrayBuffer(file)
    })
  },

  importSuppliers: (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Không thể đọc file'))
      reader.readAsArrayBuffer(file)
    })
  },

  importStructures: (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Không thể đọc file'))
      reader.readAsArrayBuffer(file)
    })
  }
}
