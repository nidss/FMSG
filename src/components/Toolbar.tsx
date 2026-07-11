import React from 'react'
import {
  Braces,
  ClipboardPaste,
  CloudUpload,
  Database,
  FilePlus2,
  GalleryHorizontalEnd,
  LayoutTemplate,
  MessageCircle,
  Redo2,
  Save,
  Send,
  Undo2,
} from 'lucide-react'
import { Button } from '@astryxdesign/core/Button'
import { IconButton } from '@astryxdesign/core/IconButton'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Divider } from '@astryxdesign/core/Divider'
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
      <IconButton label="Undo (Ctrl+Z)" icon={<Undo2 size={15} />} variant="ghost" size="sm" isDisabled={!canUndo} onClick={undo} />
      <IconButton label="Redo (Ctrl+Shift+Z)" icon={<Redo2 size={15} />} variant="ghost" size="sm" isDisabled={!canRedo} onClick={redo} />
      <span className="divider-v">
        <Divider orientation="vertical" />
      </span>
      <Button
        label="ใหม่"
        icon={<FilePlus2 size={15} />}
        variant="ghost"
        size="sm"
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
      />
      <Button label="Templates" icon={<LayoutTemplate size={15} />} variant="ghost" size="sm" onClick={() => setModal('templates')} />
      <Button label="บันทึก" icon={<Save size={15} />} variant="ghost" size="sm" tooltip="เซฟงานปัจจุบันเป็น template ของฉัน" onClick={() => setModal('save')} />
      <Button label="Sync" icon={<CloudUpload size={15} />} variant="ghost" size="sm" tooltip="Export/Import ไฟล์ และ sync ผ่าน Google Drive" onClick={() => setModal('sync')} />
      <Button label="วาง JSON" icon={<ClipboardPaste size={15} />} variant="ghost" size="sm" tooltip="วางโค้ด flex JSON จากที่อื่นมาแสดงและแก้ต่อ" onClick={() => setModal('paste')} />
      {root.type === 'bubble' && (
        <Button label="ทำเป็น Carousel" icon={<GalleryHorizontalEnd size={15} />} variant="ghost" size="sm" onClick={convertToCarousel} />
      )}
      <span className="divider-v">
        <Divider orientation="vertical" />
      </span>
      <div className="alt-text">
        <TextInput label="altText" isLabelHidden placeholder="altText (ข้อความ fallback)" value={altText} onChange={setAltText} size="sm" />
      </div>
      <span style={{ flex: 1 }} />
      <Button
        label="Data"
        icon={<Database size={15} />}
        variant={showData ? 'secondary' : 'ghost'}
        size="sm"
        onClick={toggleData}
      />
      <Button label="Export" icon={<Braces size={15} />} variant="secondary" size="sm" onClick={() => setModal('export')} />
      <Button label="ส่งเข้า LINE" icon={<Send size={15} />} variant="primary" size="sm" onClick={() => setModal('send')} />
    </div>
  )
}
