import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { IconButton } from '@astryxdesign/core/IconButton'
import { TEMPLATES } from '../flex/templates'
import { useDesigner } from '../store'
import { useUi } from '../uiStore'
import { withUids } from '../flex/uid'
import { FlexMessageView } from '../renderer/FlexRender'
import { loadUserTemplates, removeUserTemplate, type UserTemplate } from '../flex/userTemplates'
import { AppModal } from './AppModal'

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
    <AppModal
      title="Templates"
      subtitle='เลือกแล้วจะแทนที่งานปัจจุบัน (Ctrl+Z ย้อนได้) · เซฟงานเป็น template ได้จากปุ่ม "บันทึก"'
      width={920}
      onClose={() => setModal(null)}
    >
      {userTemplates.length > 0 && (
        <>
          <div className="panel-title" style={{ padding: '0 0 6px' }}>
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
                    <b style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</b>
                    <span onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        label="ลบ template นี้"
                        icon={<Trash2 size={13} />}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`ลบ template "${t.name}"?`)) {
                            setUserTemplates(removeUserTemplate(t.id))
                          }
                        }}
                      />
                    </span>
                  </div>
                  <span>บันทึกเมื่อ {new Date(t.savedAt).toLocaleString('th-TH')}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="panel-title" style={{ padding: '4px 0 6px' }}>
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
    </AppModal>
  )
}
