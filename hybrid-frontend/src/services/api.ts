export interface DashboardData {
  materials: any[]
  projects: any[]
  suppliers: any[]
  transactions: any[]
  structures: any[]
  categories?: string[]
  units?: string[]
  logs?: any[]
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch('/api/data')
  const result = await response.json()
  
  console.log('API response:', result)
  
  if (result.success && result.data) {
    return result.data as DashboardData
  }
  
  // Fallback
  return {
    materials: [],
    projects: [],
    suppliers: [],
    transactions: [],
    structures: []
  }
}
