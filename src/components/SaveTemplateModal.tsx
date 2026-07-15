import React, { useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { Banner } from '@astryxdesign/core/Banner'
import { useDesigner } from '../store'
import { useUi } from '../uiStore'
import { stripUids } from '../flex/uid'
import { loadUserTemplates, saveUserTemplate, type UserTemplate } from '../flex/userTemplates'
import { shareTemplate } from '../flex/sharedTemplates'
import { getAccessToken } from '../gdrive'
import { DEFAULT_GDRIVE_CLIENT_ID, DEFAULT_GDRIVE_FOLDER_ID } from '../config'
import { AppModal } from './AppModal'

export function SaveTemplateModal() {
  const modal = useUi((s) => s.modal)
  const setModal = useUi((s) => s.setModal)
  const root = useDesigner((s) => s.root)
  const altText = useDesigner((s) => s.altText)
  const dataText = useDesigner((s) => s.dataText)
  const [name, setName] = useState('')
  const [shareOnline, setShareOnline] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'sharing' | 'done'>('idle')
  const [doneMsg, setDoneMsg] = useState('')

  const existingNames = useMemo(() => loadUserTemplates().map((t) => t.name), [modal])

  if (modal !== 'save') return null

  const trimmed = name.trim()
  const willOverwrite = existingNames.includes(trimmed)

  const close = () => {
    setModal(null)
    setName('')
    setShareOnline(false)
    setState('idle')
    setDoneMsg('')
    setError(null)
  }

  const doSave = async () => {
    if (!trimmed) {
      setError('ตั้งชื่อ template ก่อนนะครับ')
      return
    }
    const template: Omit<UserTemplate, 'id' | 'savedAt'> = {
      name: trimmed,
      json: stripUids(root),
      altText,
      dataText,
    }
    const result = saveUserTemplate(template)
    if (result === null) {
      setError('บันทึกไม่สำเร็จ — พื้นที่เก็บของ browser เต็ม (ลองลบ template เก่า หรือเปลี่ยนรูป data URI เป็น URL)')
      return
    }
    if (shareOnline) {
      setState('sharing')
      try {
        const clientId = localStorage.getItem('fmsg-gdrive-clientid') || DEFAULT_GDRIVE_CLIENT_ID
        const folderId = localStorage.getItem('fmsg-gdrive-folder') || DEFAULT_GDRIVE_FOLDER_ID
        const token = await getAccessToken(clientId)
        const total = await shareTemplate(token, folderId, {
          ...template,
          id: `t${Date.now().toString(36)}`,
          savedAt: new Date().toISOString(),
        })
        setDoneMsg(`บันทึกและแชร์ออนไลน์แล้ว ✓ (คลังกลางมี ${total} รายการ)`)
      } catch (e: any) {
        setState('idle')
        setError(`บันทึกในเครื่องแล้ว แต่แชร์ออนไลน์ไม่สำเร็จ: ${e.message ?? e}`)
        return
      }
    } else {
      setDoneMsg('บันทึกแล้ว ✓')
    }
    setState('done')
    setTimeout(close, 900)
  }

  return (
    <AppModal title="บันทึกเป็น template" width={460} onClose={close}>
      <div className="modal-stack">
        <div onKeyDown={(e) => e.key === 'Enter' && doSave()}>
          <TextInput
            label="ชื่อ template"
            value={name}
            placeholder="เช่น ใบเสร็จร้านกาแฟ v2"
            hasAutoFocus
            onChange={(v: string) => {
              setName(v)
              setError(null)
            }}
            status={error ? { type: 'error', message: error } : undefined}
          />
        </div>
        <CheckboxInput
          label="แชร์ออนไลน์ให้ทุกคนเห็น (เก็บขึ้นคลังกลางบน Drive — ต้อง login Google)"
          value={shareOnline}
          onChange={(c: boolean) => setShareOnline(c)}
          size="sm"
        />
        {willOverwrite && state !== 'done' && (
          <Banner status="warning" title="มี template ชื่อนี้อยู่แล้ว — การบันทึกจะเขียนทับของเดิม" />
        )}
        <div className="hint">
          บันทึกทั้งดีไซน์, altText และ data source — เปิดใช้ได้จากปุ่ม Templates
          {shareOnline ? ' · แบบออนไลน์จะไปโผล่ในหมวด "Templates ออนไลน์" ของทุกคน' : ' (เก็บใน browser เครื่องนี้)'}
        </div>
        {state === 'done' && <Banner status="success" title={doneMsg} />}
        <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
          <Button
            label={state === 'sharing' ? 'กำลังแชร์…' : 'บันทึก'}
            icon={<Save size={14} />}
            variant="primary"
            onClick={doSave}
            isDisabled={state === 'done'}
            isLoading={state === 'sharing'}
          />
        </div>
      </div>
    </AppModal>
  )
}
