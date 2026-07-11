import React, { useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Banner } from '@astryxdesign/core/Banner'
import { useDesigner } from '../store'
import { useUi } from '../uiStore'
import { stripUids } from '../flex/uid'
import { loadUserTemplates, saveUserTemplate } from '../flex/userTemplates'
import { AppModal } from './AppModal'

export function SaveTemplateModal() {
  const modal = useUi((s) => s.modal)
  const setModal = useUi((s) => s.setModal)
  const root = useDesigner((s) => s.root)
  const altText = useDesigner((s) => s.altText)
  const dataText = useDesigner((s) => s.dataText)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const existingNames = useMemo(() => loadUserTemplates().map((t) => t.name), [modal])

  if (modal !== 'save') return null

  const trimmed = name.trim()
  const willOverwrite = existingNames.includes(trimmed)

  const close = () => {
    setModal(null)
    setName('')
    setSaved(false)
    setError(null)
  }

  const doSave = () => {
    if (!trimmed) {
      setError('ตั้งชื่อ template ก่อนนะครับ')
      return
    }
    const result = saveUserTemplate({ name: trimmed, json: stripUids(root), altText, dataText })
    if (result === null) {
      setError('บันทึกไม่สำเร็จ — พื้นที่เก็บของ browser เต็ม (ลองลบ template เก่า หรือเปลี่ยนรูป data URI เป็น URL)')
      return
    }
    setSaved(true)
    setTimeout(close, 700)
  }

  return (
    <AppModal title="บันทึกเป็น template ของฉัน" width={440} onClose={close}>
      <div className="modal-stack">
        <div
          onKeyDown={(e) => e.key === 'Enter' && doSave()}
        >
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
        {willOverwrite && !saved && <Banner status="warning" title="มี template ชื่อนี้อยู่แล้ว — การบันทึกจะเขียนทับของเดิม" />}
        <div className="hint">
          จะบันทึกทั้งดีไซน์, altText และ data source ไว้ใน browser เครื่องนี้ — เปิดใช้ได้จากปุ่ม Templates
        </div>
        {saved && <Banner status="success" title="บันทึกแล้ว ✓" />}
        <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
          <Button label="บันทึก" icon={<Save size={14} />} variant="primary" onClick={doSave} isDisabled={saved} />
        </div>
      </div>
    </AppModal>
  )
}
