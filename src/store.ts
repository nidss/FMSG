import { create } from 'zustand'
import type { AnyNode, BubbleBlock, BubbleNode, FlexContainer } from './flex/types'
import { findNode, findParent, findPath, getAtPath, withUids } from './flex/uid'
import { canContain, createEmptyBubble, createNode, type PaletteKind } from './flex/defaults'

export interface DropTarget {
  /** uid of the container (box / carousel / text) receiving the child */
  parentUid: string
  /** insert position within parent.contents; null = append */
  index: number | null
}

export type DragPayload =
  | { kind: 'new'; palette: PaletteKind }
  | { kind: 'move'; uid: string }

interface DesignerState {
  root: FlexContainer
  altText: string
  selectedUid: string | null
  dataText: string
  bindingEnabled: boolean
  past: string[]
  future: string[]
  drag: DragPayload | null

  select: (uid: string | null) => void
  setAltText: (t: string) => void
  setDataText: (t: string) => void
  setBindingEnabled: (b: boolean) => void
  setDrag: (d: DragPayload | null) => void

  loadRoot: (plainJson: any) => void
  updateNode: (uid: string, patch: Record<string, any>) => void
  removeNode: (uid: string) => void
  duplicateNode: (uid: string) => void
  moveNode: (uid: string, dir: -1 | 1) => void
  insertNew: (kind: PaletteKind, target: DropTarget) => void
  moveTo: (uid: string, target: DropTarget) => void
  setBubbleBlock: (bubbleUid: string, block: BubbleBlock, value: any | null) => void
  addBubbleToCarousel: () => void
  convertToCarousel: () => void
  undo: () => void
  redo: () => void
}

const STORAGE_KEY = 'fmsg-designer-v1'

const DEFAULT_DATA = JSON.stringify(
  { name: 'สมชาย ใจดี', shop: 'Cafe de Flex', total: '380', date: '2026-07-10' },
  null,
  2,
)

function loadInitial(): { root: FlexContainer; altText: string; dataText: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (saved.root?.type) {
        return {
          root: withUids(saved.root),
          altText: saved.altText ?? 'Flex Message',
          dataText: typeof saved.dataText === 'string' ? saved.dataText : DEFAULT_DATA,
        }
      }
    }
  } catch {
    /* corrupted save — start fresh */
  }
  return { root: createEmptyBubble(), altText: 'Flex Message', dataText: DEFAULT_DATA }
}

function persist(state: Pick<DesignerState, 'root' | 'altText' | 'dataText'>) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ root: state.root, altText: state.altText, dataText: state.dataText }),
    )
  } catch {
    /* storage full (e.g. big data-URI images) — ignore */
  }
}

/** Deep-clone the tree so mutations are safe, then commit with history. */
function mutate(get: () => DesignerState, set: any, fn: (root: FlexContainer) => FlexContainer | void) {
  const state = get()
  const snapshot = JSON.stringify(state.root)
  const clone: FlexContainer = JSON.parse(snapshot)
  const result = fn(clone) || clone
  const next = {
    root: result,
    past: [...state.past.slice(-49), snapshot],
    future: [] as string[],
  }
  set(next)
  persist({ ...state, root: result })
}

export const useDesigner = create<DesignerState>((set, get) => ({
  ...loadInitial(),
  selectedUid: null,
  bindingEnabled: false,
  past: [],
  future: [],
  drag: null,

  select: (uid) => set({ selectedUid: uid }),
  setAltText: (t) => {
    set({ altText: t })
    persist({ ...get(), altText: t })
  },
  setDataText: (t) => {
    set({ dataText: t })
    persist({ ...get(), dataText: t })
  },
  setBindingEnabled: (b) => set({ bindingEnabled: b }),
  setDrag: (d) => set({ drag: d }),

  loadRoot: (plainJson) => {
    const root = withUids(plainJson) as FlexContainer
    const state = get()
    set({
      root,
      selectedUid: null,
      past: [...state.past.slice(-49), JSON.stringify(state.root)],
      future: [],
    })
    persist({ ...state, root })
  },

  updateNode: (uid, patch) =>
    mutate(get, set, (root) => {
      const node = findNode(root, uid)
      if (!node) return
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === '' || v === null) delete (node as any)[k]
        else (node as any)[k] = v
      }
    }),

  removeNode: (uid) => {
    mutate(get, set, (root) => {
      const loc = findParent(root, uid)
      if (!loc) return
      if (loc.index !== null) (loc.parent as any)[loc.key].splice(loc.index, 1)
      else delete (loc.parent as any)[loc.key]
    })
    if (get().selectedUid === uid) set({ selectedUid: null })
  },

  duplicateNode: (uid) =>
    mutate(get, set, (root) => {
      const loc = findParent(root, uid)
      if (!loc || loc.index === null) return
      const arr = (loc.parent as any)[loc.key]
      arr.splice(loc.index + 1, 0, withUids(arr[loc.index]))
    }),

  moveNode: (uid, dir) =>
    mutate(get, set, (root) => {
      const loc = findParent(root, uid)
      if (!loc || loc.index === null) return
      const arr = (loc.parent as any)[loc.key]
      const j = loc.index + dir
      if (j < 0 || j >= arr.length) return
      ;[arr[loc.index], arr[j]] = [arr[j], arr[loc.index]]
    }),

  insertNew: (kind, target) => {
    const node = createNode(kind)
    mutate(get, set, (root) => {
      const parent = findNode(root, target.parentUid)
      if (!parent || !canContain(parent, node.type)) return
      const arr = ((parent as any).contents ??= [])
      arr.splice(target.index ?? arr.length, 0, node)
    })
    set({ selectedUid: (node as any)._uid })
  },

  moveTo: (uid, target) =>
    mutate(get, set, (root) => {
      if (uid === target.parentUid) return
      const node = findNode(root, uid)
      const parent = findNode(root, target.parentUid)
      if (!node || !parent || !canContain(parent, node.type)) return
      // reject dropping a node into its own descendant
      if (findPath(node, target.parentUid)) return
      const loc = findParent(root, uid)
      if (!loc) return
      let index = target.index
      if (loc.index !== null) {
        const arr = (loc.parent as any)[loc.key]
        // adjust index when moving within the same array to an later slot
        if ((loc.parent as any)._uid === (parent as any)._uid && index !== null && index > loc.index) index -= 1
        arr.splice(loc.index, 1)
      } else {
        delete (loc.parent as any)[loc.key]
      }
      const arr = ((parent as any).contents ??= [])
      arr.splice(index ?? arr.length, 0, node)
    }),

  setBubbleBlock: (bubbleUid, block, value) =>
    mutate(get, set, (root) => {
      const bubble = findNode(root, bubbleUid) as BubbleNode | null
      if (!bubble || bubble.type !== 'bubble') return
      if (value === null) delete (bubble as any)[block]
      else (bubble as any)[block] = withUids(value)
    }),

  addBubbleToCarousel: () =>
    mutate(get, set, (root) => {
      if (root.type !== 'carousel') return
      if (root.contents.length >= 12) return
      root.contents.push(createEmptyBubble())
    }),

  convertToCarousel: () =>
    mutate(get, set, (root) => {
      if (root.type === 'carousel') return
      return withUids({ type: 'carousel', contents: [root] }) as any as FlexContainer
    }),

  undo: () => {
    const { past, future, root } = get()
    if (!past.length) return
    const prev = past[past.length - 1]
    set({
      root: JSON.parse(prev),
      past: past.slice(0, -1),
      future: [JSON.stringify(root), ...future].slice(0, 50),
      selectedUid: null,
    })
    persist(get())
  },

  redo: () => {
    const { past, future, root } = get()
    if (!future.length) return
    const next = future[0]
    set({
      root: JSON.parse(next),
      past: [...past, JSON.stringify(root)].slice(-50),
      future: future.slice(1),
      selectedUid: null,
    })
    persist(get())
  },
}))

export function getSelectedNode(state: DesignerState): AnyNode | null {
  if (!state.selectedUid) return null
  return findNode(state.root, state.selectedUid)
}
