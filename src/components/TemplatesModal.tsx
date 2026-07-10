import React from 'react'
import { X } from 'lucide-react'
import { TEMPLATES } from '../flex/templates'
import { useDesigner } from '../store'
import { useUi } from '../uiStore'
import { withUids } from '../flex/uid'
import { FlexMessageView } from '../renderer/FlexRender'

export function TemplatesModal() {
  const modal = useUi((s) => s.modal)
  const setModal = useUi((s) => s.setModal)
  const loadRoot = useDesigner((s) => s.loadRoot)
  if (modal !== 'templates') return null
  return (
    <div className="modal-overlay" onClick={() => setModal(null)}>
      <div className="modal" style={{ width: 900, maxWidth: '95vw' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b>Templates สำเร็จรูป</b>
          <button className="icon-btn" onClick={() => setModal(null)}>
            <X size={16} />
          </button>
        </div>
        <div className="template-grid">
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="template-card"
              onClick={() => {
                loadRoot(t.json)
                setModal(null)
              }}
            >
              <div className="template-preview">
                <div className="template-scale">
                  <FlexMessageView node={withUids(t.json)} interactive={false} />
                </div>
              </div>
              <div className="template-meta">
                <b>{t.name}</b>
                <span>{t.description}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="hint" style={{ padding: '0 16px 14px' }}>
          ⚠️ การเลือก template จะแทนที่งานปัจจุบัน (กด Ctrl+Z เพื่อย้อนกลับได้)
        </div>
      </div>
    </div>
  )
}
