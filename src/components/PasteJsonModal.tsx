import React, { useMemo, useState } from 'react'
import { ClipboardPaste, Import } from 'lucide-react'
import { Button } from '@astryxdesign/core/Button'
import { Banner } from '@astryxdesign/core/Banner'
import { useDesigner } from '../store'
import { useUi } from '../uiStore'
import { withUids } from '../flex/uid'
import { parsePastedFlex } from '../flex/importJson'
import { FlexMessageView } from '../renderer/FlexRender'
import { AppModal } from './AppModal'

export function PasteJsonModal() {
  const modal = useUi((s) => s.modal)
  const setModal = useUi((s) => s.setModal)
  const loadRoot = useDesigner((s) => s.loadRoot)
  const setAltText = useDesigner((s) => s.setAltText)
  const [text, setText] = useState('')

  const parsed = useMemo(() => {
    if (!text.trim()) return null
    try {
      const p = parsePastedFlex(text)
      return { ...p, preview: withUids(p.contents), error: null as string | null }
    } catch (e: any) {
      return { contents: null, preview: null, altText: undefined, error: String(e.message ?? e) }
    }
  }, [text])

  if (modal !== 'paste') return null

  const close = () => {
    setModal(null)
    setText('')
  }

  const load = () => {
    if (!parsed?.contents) return
    loadRoot(parsed.contents)
    if (parsed.altText) setAltText(parsed.altText)
    close()
  }

  const pasteFromClipboard = async () => {
    try {
      setText(await navigator.clipboard.readText())
    } catch {
      /* permission denied — user can paste manually */
    }
  }

  return (
    <AppModal
      title="วาง JSON จากที่อื่น"
      subtitle="รองรับ bubble/carousel, message เต็ม หรือ payload ที่มี messages"
      width={880}
      onClose={close}
    >
      <div className="paste-layout">
        <div className="paste-left">
          <textarea
            autoFocus
            className="paste-editor"
            spellCheck={false}
            placeholder={'วางโค้ด JSON ที่นี่ เช่น\n{\n  "type": "bubble",\n  "body": { ... }\n}'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="btn-row">
            <Button label="วางจากคลิปบอร์ด" icon={<ClipboardPaste size={14} />} size="sm" onClick={pasteFromClipboard} />
            <span style={{ flex: 1 }} />
            <Button label="โหลดเข้า editor" icon={<Import size={14} />} variant="primary" size="sm" isDisabled={!parsed?.contents} onClick={load} />
          </div>
          {parsed?.error && <Banner status="error" title={parsed.error} />}
          {parsed?.contents && (
            <Banner
              status="success"
              title={`พบ ${parsed.contents.type === 'carousel' ? `carousel (${parsed.contents.contents?.length ?? 0} bubbles)` : 'bubble'}${parsed.altText ? ` · altText: "${parsed.altText}"` : ''}`}
              description="ดูตัวอย่างด้านขวา — การโหลดจะแทนที่งานปัจจุบัน (Ctrl+Z ย้อนได้)"
            />
          )}
        </div>
        <div className="paste-preview">
          {parsed?.preview ? (
            <div className="paste-preview-scale">
              <FlexMessageView node={parsed.preview} interactive={false} />
            </div>
          ) : (
            <div className="hint" style={{ margin: 'auto' }}>
              ตัวอย่างจะแสดงที่นี่เมื่อ JSON ถูกต้อง
            </div>
          )}
        </div>
      </div>
    </AppModal>
  )
}
