import React, { useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { TEMPLATES } from '../flex/templates'
import { useDesigner } from '../store'
import { useUi } from '../uiStore'
import { withUids } from '../flex/uid'
import { FlexMessageView } from '../renderer/FlexRender'
import { loadUserTemplates, removeUserTemplate, type UserTemplate } from '../flex/userTemplates'

export function TemplatesModal() {
  const modal = useUi((s) => s.modal)
  const setModal = useUi((s) => s.setModal)
  const loadRoot = useDesigner((s) => s.loadRoot)
  const setAltText = useDesigner((s) => s.setAltText)
  const setDataText = useDesigner((s) => s.setDataText)
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([])

  // refresh the list every time the modal opens
  React.useEffect(() => {
    if (modal === 'templates') setUserTemplates(loadUserTemplates())
  }, [modal])

  if (modal !== 'templates') return null

  const applyUserTemplate = (t: UserTemplate) => {
    loadRoot(t.json)
    setAltText(t.altText)
    if (t.dataText) setDataText(t.dataText)
    setModal(null)
  }

  return (
    <div className="modal-overlay" onClick={() => setModal(null)}>
      <div className="modal" style={{ width: 900, maxWidth: '95vw' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b>Templates</b>
          <button className="icon-btn" onClick={() => setModal(null)}>
            <X size={16} />
          </button>
        </div>
        <div style={{ overflow: 'auto' }}>
          {userTemplates.length > 0 && (
            <>
              <div className="panel-title" style={{ padding: '0 16px 6px' }}>
                Templates ของฉัน ({userTemplates.length})
              </div>
              <div className="template-grid">
                {userTemplates.map((t) => (
                  <div key={t.id} className="template-card" onClick={() => applyUserTemplate(t)}>
                    <div className="template-preview">
                      <div className="template-scale">
                        <FlexMessageView node={withUids(t.json)} interactive={false} />
                      </div>
                    </div>
                    <div className="template-meta">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <b style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.name}
                        </b>
                        <button
                          className="icon-btn"
                          title="ลบ template นี้"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`ลบ template "${t.name}"?`)) {
                              setUserTemplates(removeUserTemplate(t.id))
                            }
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <span>บันทึกเมื่อ {new Date(t.savedAt).toLocaleString('th-TH')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="panel-title" style={{ padding: '4px 16px 6px' }}>
            Templates สำเร็จรูป
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
        </div>
        <div className="hint" style={{ padding: '8px 16px 14px' }}>
          ⚠️ การเลือก template จะแทนที่งานปัจจุบัน (กด Ctrl+Z เพื่อย้อนกลับได้) · เซฟงานปัจจุบันเป็น template
          ได้จากปุ่ม "บันทึก" บน toolbar
        </div>
      </div>
    </div>
  )
}
