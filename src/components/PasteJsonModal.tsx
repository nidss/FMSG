import React, { useMemo, useState } from 'react'
import { ClipboardPaste, Import, X } from 'lucide-react'
import { useDesigner } from '../store'
import { useUi } from '../uiStore'
import { withUids } from '../flex/uid'
import { parsePastedFlex } from '../flex/importJson'
import { FlexMessageView } from '../renderer/FlexRender'

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
    <div className="modal-overlay" onClick={close}>
      <div className="modal" style={{ width: 860, maxWidth: '95vw' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b>วาง JSON จากที่อื่น</b>
          <span className="hint-inline">รองรับ bubble/carousel, message เต็ม หรือ payload ที่มี messages</span>
          <button className="icon-btn" onClick={close}>
            <X size={16} />
          </button>
        </div>
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
              <button className="btn" onClick={pasteFromClipboard}>
                <ClipboardPaste size={14} /> วางจากคลิปบอร์ด
              </button>
              <span style={{ flex: 1 }} />
              <button className="btn primary" disabled={!parsed?.contents} onClick={load}>
                <Import size={14} /> โหลดเข้า editor
              </button>
            </div>
            {parsed?.error && <div className="status error">{parsed.error}</div>}
            {parsed?.contents && (
              <div className="status ok">
                พบ {parsed.contents.type === 'carousel' ? `carousel (${parsed.contents.contents?.length ?? 0} bubbles)` : 'bubble'}
                {parsed.altText ? ` · altText: "${parsed.altText}"` : ''} — ดูตัวอย่างด้านขวา
              </div>
            )}
            <div className="hint">การโหลดจะแทนที่งานปัจจุบัน (กด Ctrl+Z เพื่อย้อนกลับได้)</div>
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
      </div>
    </div>
  )
}
