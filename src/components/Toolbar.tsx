import React from 'react'
import {
  Braces,
  Database,
  FilePlus2,
  GalleryHorizontalEnd,
  LayoutTemplate,
  MessageCircle,
  Redo2,
  Send,
  Undo2,
} from 'lucide-react'
import { useDesigner } from '../store'
import { useUi } from '../uiStore'

export function Toolbar() {
  const undo = useDesigner((s) => s.undo)
  const redo = useDesigner((s) => s.redo)
  const canUndo = useDesigner((s) => s.past.length > 0)
  const canRedo = useDesigner((s) => s.future.length > 0)
  const root = useDesigner((s) => s.root)
  const altText = useDesigner((s) => s.altText)
  const setAltText = useDesigner((s) => s.setAltText)
  const convertToCarousel = useDesigner((s) => s.convertToCarousel)
  const loadRoot = useDesigner((s) => s.loadRoot)
  const setModal = useUi((s) => s.setModal)
  const toggleData = useUi((s) => s.toggleData)
  const showData = useUi((s) => s.showData)

  return (
    <div className="toolbar">
      <div className="brand">
        <MessageCircle size={18} />
        <b>Flex Designer</b>
      </div>
      <button className="btn" disabled={!canUndo} onClick={undo} title="Undo (Ctrl+Z)">
        <Undo2 size={14} />
      </button>
      <button className="btn" disabled={!canRedo} onClick={redo} title="Redo (Ctrl+Shift+Z)">
        <Redo2 size={14} />
      </button>
      <span className="divider" />
      <button
        className="btn"
        onClick={() => {
          if (confirm('เริ่มงานใหม่? งานปัจจุบันจะถูกแทนที่ (undo ได้)')) {
            loadRoot({
              type: 'bubble',
              body: {
                type: 'box',
                layout: 'vertical',
                spacing: 'md',
                contents: [{ type: 'text', text: 'Hello, World!', size: 'lg', weight: 'bold' }],
              },
            })
          }
        }}
      >
        <FilePlus2 size={14} /> ใหม่
      </button>
      <button className="btn" onClick={() => setModal('templates')}>
        <LayoutTemplate size={14} /> Templates
      </button>
      {root.type === 'bubble' && (
        <button className="btn" onClick={convertToCarousel} title="แปลงเป็น carousel หลายใบ">
          <GalleryHorizontalEnd size={14} /> ทำเป็น Carousel
        </button>
      )}
      <span className="divider" />
      <label className="alt-text">
        <span>altText</span>
        <input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="ข้อความ fallback" />
      </label>
      <span style={{ flex: 1 }} />
      <button className={`btn${showData ? ' active' : ''}`} onClick={toggleData}>
        <Database size={14} /> Data
      </button>
      <button className="btn" onClick={() => setModal('export')}>
        <Braces size={14} /> Export
      </button>
      <button className="btn primary" onClick={() => setModal('send')}>
        <Send size={14} /> ส่งเข้า LINE
      </button>
    </div>
  )
}
