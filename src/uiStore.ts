import { create } from 'zustand'

export type ModalKind = 'templates' | 'export' | 'send' | 'save' | 'sync' | null

interface UiState {
  modal: ModalKind
  /** when set, the icon picker is open and will write the picked URL to this node uid + prop */
  iconPicker: { uid: string; prop: string } | null
  showData: boolean
  setModal: (m: ModalKind) => void
  openIconPicker: (uid: string, prop: string) => void
  closeIconPicker: () => void
  toggleData: () => void
}

export const useUi = create<UiState>((set) => ({
  modal: null,
  iconPicker: null,
  showData: false,
  setModal: (m) => set({ modal: m }),
  openIconPicker: (uid, prop) => set({ iconPicker: { uid, prop } }),
  closeIconPicker: () => set({ iconPicker: null }),
  toggleData: () => set((s) => ({ showData: !s.showData })),
}))
