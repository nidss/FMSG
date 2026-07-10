import React, { useEffect } from 'react'
import { Toolbar } from './components/Toolbar'
import { Palette } from './components/Palette'
import { TreeView } from './components/TreeView'
import { Inspector } from './components/Inspector'
import { PreviewPane } from './components/PreviewPane'
import { DataPanel } from './components/DataPanel'
import { TemplatesModal } from './components/TemplatesModal'
import { ExportModal } from './components/ExportModal'
import { SendModal } from './components/SendModal'
import { IconPickerModal } from './components/IconPickerModal'
import { useDesigner } from './store'

export default function App() {
  const undo = useDesigner((s) => s.undo)
  const redo = useDesigner((s) => s.redo)
  const removeNode = useDesigner((s) => s.removeNode)
  const selectedUid = useDesigner((s) => s.selectedUid)
  const root = useDesigner((s) => s.root)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (typing) return
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !typing && selectedUid && selectedUid !== (root as any)._uid) {
        e.preventDefault()
        removeNode(selectedUid)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, removeNode, selectedUid, root])

  return (
    <div className="app">
      <Toolbar />
      <div className="main">
        <div className="sidebar-left">
          <Palette />
          <TreeView />
        </div>
        <PreviewPane />
        <DataPanel />
        <div className="sidebar-right">
          <Inspector />
        </div>
      </div>
      <TemplatesModal />
      <ExportModal />
      <SendModal />
      <IconPickerModal />
    </div>
  )
}
