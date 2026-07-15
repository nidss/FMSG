import React, { useState } from 'react'
import { Globe, Trash2 } from 'lucide-react'
import { IconButton } from '@astryxdesign/core/IconButton'
import { Button } from '@astryxdesign/core/Button'
import { Banner } from '@astryxdesign/core/Banner'
import { TEMPLATES } from '../flex/templates'
import { useDesigner } from '../store'
import { useUi } from '../uiStore'
import { withUids } from '../flex/uid'
import { FlexMessageView } from '../renderer/FlexRender'
import { loadUserTemplates, removeUserTemplate, type UserTemplate } from '../flex/userTemplates'
import { fetchSharedOAuth, fetchSharedPublic } from '../flex/sharedTemplates'
import { getAccessToken } from '../gdrive'
import { DEFAULT_GDRIVE_API_KEY, DEFAULT_GDRIVE_CLIENT_ID, DEFAULT_GDRIVE_FOLDER_ID } from '../config'

function driveSettings() {
  return {
    apiKey: localStorage.getItem('fmsg-gdrive-apikey') || DEFAULT_GDRIVE_API_KEY,
    clientId: localStorage.getItem('fmsg-gdrive-clientid') || DEFAULT_GDRIVE_CLIENT_ID,
    folderId: localStorage.getItem('fmsg-gdrive-folder') || DEFAULT_GDRIVE_FOLDER_ID,
  }
}
import { AppModal } from './AppModal'

export function TemplatesModal() {
  const modal = useUi((s) => s.modal)
  const setModal = useUi((s) => s.setModal)
  const loadRoot = useDesigner((s) => s.loadRoot)
  const setAltText = useDesigner((s) => s.setAltText)
  const setDataText = useDesigner((s) => s.setDataText)
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([])
  const [shared, setShared] = useState<UserTemplate[] | null>(null)
  const [sharedState, setSharedState] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle')
  const [sharedError, setSharedError] = useState('')

  const loadShared = React.useCallback(async (viaOAuth: boolean) => {
    const { apiKey, clientId, folderId } = driveSettings()
    setSharedState('loading')
    setSharedError('')
    try {
      let list: UserTemplate[] | null = null
      if (!viaOAuth && apiKey) {
        list = await fetchSharedPublic(apiKey, folderId)
      } else {
        const token = await getAccessToken(clientId)
        list = await fetchSharedOAuth(token, folderId)
      }
      setShared(list ?? [])
      setSharedState('ready')
    } catch (e: any) {
      setSharedError(String(e.message ?? e))
      setSharedState('error')
    }
  }, [])

  // refresh the list every time the modal opens; auto-load online templates
  // without login when an API key is configured
  React.useEffect(() => {
    if (modal === 'templates') {
      setUserTemplates(loadUserTemplates())
      if (driveSettings().apiKey) loadShared(false)
    }
  }, [modal, loadShared])

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
      <div className="panel-title" style={{ padding: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Globe size={13} /> Templates ออนไลน์ (เห็นร่วมกันทุกคน)
        {shared !== null && <span style={{ fontWeight: 400 }}>· {shared.length} รายการ</span>}
        <span style={{ flex: 1 }} />
        <Button
          label={sharedState === 'loading' ? 'กำลังโหลด…' : shared === null ? 'โหลดผ่านบัญชี Google' : 'รีเฟรช'}
          variant="ghost"
          size="sm"
          isDisabled={sharedState === 'loading'}
          onClick={() => loadShared(shared === null && !driveSettings().apiKey)}
        />
      </div>
      {sharedState === 'error' && <Banner status="error" title={sharedError} />}
      {sharedState === 'ready' && shared && shared.length === 0 && (
        <div className="hint" style={{ paddingBottom: 8 }}>
          ยังไม่มี template ในคลังออนไลน์ — ติ๊ก "แชร์ออนไลน์" ตอนกดบันทึกเพื่อเพิ่มอันแรก
        </div>
      )}
      {sharedState === 'idle' && shared === null && (
        <div className="hint" style={{ paddingBottom: 8 }}>
          กดปุ่มด้านบนเพื่อโหลดคลัง template ที่ทีมแชร์ไว้บน Drive
        </div>
      )}
      {shared && shared.length > 0 && (
        <div className="template-grid">
          {shared.map((t) => (
            <div key={'sh-' + t.name} className="template-card" onClick={() => applyUserTemplate(t)}>
              <div className="template-preview">
                <div className="template-scale">
                  <FlexMessageView node={withUids(t.json)} interactive={false} />
                </div>
              </div>
              <div className="template-meta">
                <b>{t.name}</b>
                <span>อัปเดต {new Date(t.savedAt).toLocaleString('th-TH')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {userTemplates.length > 0 && (
        <>
          <div className="panel-title" style={{ padding: '4px 0 6px' }}>
            Templates ของฉัน ({userTemplates.length}) — เฉพาะเครื่องนี้
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
