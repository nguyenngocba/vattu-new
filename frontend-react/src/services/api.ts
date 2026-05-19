import axios from 'axios'

export const api = axios.create({
  baseURL: '/',
  timeout: 20_000,
})

export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

export type Material = {
  id: string
  name: string
  cat?: string
  unit?: string
  qty?: number | string
  cost?: number | string
  low?: number | string
  note?: string
}

export type Project = {
  id: string
  name: string
  budget?: number | string
  spent?: number | string
}

export type Supplier = {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
}

export type StructureMaterial = {
  structure_id: string
  material_id: string
  material_name: string
  unit?: string
  quantity?: number | string
}

export type Structure = {
  id: string
  name: string
  type?: string
  unit?: string
  qty?: number | string
  cost?: number | string
  note?: string
  zone?: string
  position_y?: number | string
  layer?: number | string
  weight?: number | string
  materials?: StructureMaterial[]
}

export type StructureWarehouseItem = {
  material_id: string
  material_name: string
  unit?: string
  qty?: number | string
  cost?: number | string
}

export type StructureWarehouseLog = {
  id?: string
  material_id: string
  material_name?: string
  qty?: number | string
  unit?: string
  cost?: number | string
  note?: string
  attachment?: unknown
  type?: 'transfer_to_sw' | 'return_to_main' | string
  created_at?: string
}

export type StructureWarehouseTransferItem = {
  mid: string
  name: string
  unit?: string
  qty: number
  cost?: number
}

export type Transaction = {
  id: string
  mid?: string
  type?: string
  qty?: number | string
  total_amount?: number | string
  totalAmount?: number | string
  unit_price?: number | string
  unitPrice?: number | string
  supplier_id?: string
  supplierId?: string
  project_id?: string
  projectId?: string
  datetime?: string
  date?: string
  note?: string
  attachment?: unknown
}

export type MaterialTransactionInput = {
  mid: string
  type: 'purchase' | 'usage' | 'return'
  qty: number
  unitPrice: number
  vatRate: number
  supplierId?: string
  projectId?: string
  note?: string
  attachment?: string
}

export type StructureOperationInput = {
  structureId: string
  projectId?: string
  quantity: number
  note?: string
  attachment?: string
}

export type SteelTrackData = {
  materials: Material[]
  projects: Project[]
  suppliers: Supplier[]
  structures: Structure[]
  structureMaterials: StructureMaterial[]
  transactions: Transaction[]
  users?: User[]
  categories?: string[]
  units?: string[]
}

export type User = {
  id: string
  name: string
  username: string
  role: string
  permissions?: Record<string, boolean>
}

export const numberValue = (value: number | string | undefined | null) => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export const formatNumber = (value: number | string | undefined | null, maximumFractionDigits = 0) =>
  numberValue(value).toLocaleString('vi-VN', { maximumFractionDigits })

export const formatMoney = (value: number | string | undefined | null) =>
  `${Math.round(numberValue(value)).toLocaleString('vi-VN')} đ`

export const formatCompactMoney = (value: number | string | undefined | null) => {
  const amount = numberValue(value)
  if (Math.abs(amount) >= 1_000_000_000) return `${(amount / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`
  if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`
  return formatMoney(amount)
}

export const parseAttachment = (attachment: unknown): UploadedFile[] => {
  if (!attachment) return []
  if (Array.isArray(attachment)) return attachment.filter(Boolean) as UploadedFile[]
  if (typeof attachment !== 'string') return []
  try {
    const parsed = JSON.parse(attachment)
    return Array.isArray(parsed) ? parsed.filter(Boolean) as UploadedFile[] : []
  } catch {
    return []
  }
}

export const fetchSteelTrackData = async (): Promise<SteelTrackData> => {
  const response = await api.get<ApiResponse<SteelTrackData>>('/api/data')
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Không tải được dữ liệu SteelTrack')
  }
  const data = response.data.data
  return {
    ...data,
    structures: data.structures.map((structure) => ({
      ...structure,
      materials: data.structureMaterials.filter((item) => item.structure_id === structure.id),
    })),
  }
}

export const login = async (username: string, password: string): Promise<User> => {
  const response = await api.post<{ success: boolean; user?: User; error?: string }>('/api/login', { username, password })
  if (!response.data.success || !response.data.user) {
    throw new Error(response.data.error || 'Đăng nhập không thành công')
  }
  return response.data.user
}

export const makeId = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const assertSuccess = (response: { data: { success: boolean; error?: string } }) => {
  if (!response.data.success) throw new Error(response.data.error || 'Thao tác không thành công')
}

export const saveMaterial = async (material: Material) => {
  const response = await api.post('/api/materials', material)
  assertSuccess(response)
}

export const deleteMaterial = async (id: string) => {
  const response = await api.delete(`/api/materials/${encodeURIComponent(id)}`)
  assertSuccess(response)
}

export const saveProject = async (project: Project) => {
  const response = await api.post('/api/projects', project)
  assertSuccess(response)
}

export const deleteProject = async (id: string) => {
  const response = await api.delete(`/api/projects/${encodeURIComponent(id)}`)
  assertSuccess(response)
}

export const saveSupplier = async (supplier: Supplier) => {
  const response = await api.post('/api/suppliers', supplier)
  assertSuccess(response)
}

export const deleteSupplier = async (id: string) => {
  const response = await api.delete(`/api/suppliers/${encodeURIComponent(id)}`)
  assertSuccess(response)
}

export const saveStructure = async (structure: Structure) => {
  const response = await api.post('/api/structures', {
    ...structure,
    materials: (structure.materials || []).map((item) => ({
      materialId: item.material_id,
      materialName: item.material_name,
      unit: item.unit,
      quantity: item.quantity,
    })),
  })
  assertSuccess(response)
}

export const deleteStructure = async (id: string) => {
  const response = await api.delete(`/api/structures/${encodeURIComponent(id)}`)
  assertSuccess(response)
}

export const fetchStructureWarehouse = async (): Promise<StructureWarehouseItem[]> => {
  const response = await api.get<ApiResponse<StructureWarehouseItem[]>>('/api/structure-warehouse')
  if (!response.data.success) throw new Error(response.data.error || 'Không tải được kho cấu kiện')
  return response.data.data || []
}

export const fetchStructureWarehouseLogs = async (materialId: string): Promise<StructureWarehouseLog[]> => {
  const response = await api.get<ApiResponse<StructureWarehouseLog[]>>(`/api/sw-logs/${encodeURIComponent(materialId)}`)
  if (!response.data.success) throw new Error(response.data.error || 'Không tải được lịch sử kho cấu kiện')
  return response.data.data || []
}

export const transferToStructureWarehouse = async (input: {
  items: StructureWarehouseTransferItem[]
  note?: string
  attachment?: string
  datetime?: string
}) => {
  const response = await api.post('/api/transfer-to-structure-warehouse', {
    items: input.items,
    note: input.note || '',
    attachment: input.attachment || '[]',
    datetime: input.datetime || new Date().toISOString(),
  })
  assertSuccess(response)
}

export const returnFromStructureWarehouse = async (input: {
  materialId: string
  qty: number
  note?: string
  datetime?: string
}) => {
  const response = await api.post('/api/return-from-sw', {
    material_id: input.materialId,
    qty: input.qty,
    note: input.note || 'Trả lại kho chính',
    datetime: input.datetime || new Date().toISOString(),
  })
  assertSuccess(response)
}

export const saveMaterialTransaction = async (input: MaterialTransactionInput) => {
  const now = new Date()
  const subtotal = input.qty * input.unitPrice
  const vatAmount = subtotal * input.vatRate / 100
  const totalAmount = subtotal + vatAmount
  const response = await api.post('/api/transactions', {
    id: makeId('T'),
    mid: input.mid,
    type: input.type,
    qty: input.qty,
    unitPrice: input.unitPrice,
    vatRate: input.vatRate,
    subtotal,
    vatAmount,
    totalAmount,
    supplierId: input.supplierId || '',
    projectId: input.projectId || '',
    note: input.note || '',
    attachment: input.attachment || '[]',
    invoiceImage: '',
    date: now.toISOString().slice(0, 10),
    datetime: now.toISOString(),
  })
  assertSuccess(response)
}

export const produceStructure = async (input: StructureOperationInput) => {
  const response = await api.post('/api/produce-structure', {
    structureId: input.structureId,
    quantity: input.quantity,
    datetime: new Date().toISOString(),
    note: input.note || '',
    attachment: input.attachment || '[]',
  })
  assertSuccess(response)
}

export const exportStructure = async (input: StructureOperationInput) => {
  const response = await api.post('/api/export-structure', {
    structureId: input.structureId,
    projectId: input.projectId,
    quantity: input.quantity,
    datetime: new Date().toISOString(),
    note: input.note || '',
    attachment: input.attachment || '[]',
  })
  assertSuccess(response)
}

export const returnStructure = async (input: StructureOperationInput) => {
  const response = await api.post('/api/return-structure', {
    structureId: input.structureId,
    projectId: input.projectId,
    qty: input.quantity,
    datetime: new Date().toISOString(),
    note: input.note || '',
    attachment: input.attachment || '[]',
  })
  assertSuccess(response)
}

export const saveCategories = async (categories: string[]) => {
  const response = await api.post('/api/categories', { categories })
  assertSuccess(response)
}

export const saveUnits = async (units: string[]) => {
  const response = await api.post('/api/units', { units })
  assertSuccess(response)
}

export type UploadedFile = {
  path: string
  name: string
}

export const uploadTempFiles = async (files: FileList | File[], type: string): Promise<UploadedFile[]> => {
  const uploaded: UploadedFile[] = []
  for (const file of Array.from(files)) {
    const formData = new FormData()
    formData.append('file', file)
    const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const response = await api.post<{ success: boolean; path?: string; error?: string }>(`/api/upload/${type}/${id}`, formData)
    if (!response.data.success || !response.data.path) throw new Error(response.data.error || 'Upload file thất bại')
    uploaded.push({ path: response.data.path, name: file.name })
  }
  return uploaded
}

export const moveUploadedFiles = async (files: UploadedFile[], type: string): Promise<UploadedFile[]> => {
  const moved: UploadedFile[] = []
  for (const file of files) {
    const response = await api.post<{ success: boolean; path?: string; error?: string }>('/api/move-file', { path: file.path, type })
    if (!response.data.success || !response.data.path) throw new Error(response.data.error || 'Di chuyển file thất bại')
    moved.push({ path: response.data.path, name: file.name })
  }
  return moved
}
