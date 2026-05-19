import { create } from 'zustand'

type UiState = {
  rightPanelOpen: boolean
  selectedEntityType: 'material' | 'structure' | 'project' | 'supplier' | null
  selectedComponentId: string | null
  selectedEntityId: string | null
  setRightPanelOpen: (open: boolean) => void
  selectComponent: (id: string | null) => void
  selectEntity: (type: UiState['selectedEntityType'], id: string | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  rightPanelOpen: true,
  selectedEntityType: null,
  selectedComponentId: null,
  selectedEntityId: null,
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  selectComponent: (id) => set({ selectedComponentId: id, selectedEntityType: id ? 'structure' : null, selectedEntityId: id }),
  selectEntity: (type, id) => set({ selectedEntityType: type, selectedEntityId: id, selectedComponentId: type === 'structure' ? id : null }),
}))
