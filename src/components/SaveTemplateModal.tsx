import React, { useMemo, useState } from 'react'
import { Save, X } from 'lucide-react'
import { useDesigner } from '../store'
import { useUi } from '../uiStore'
import { stripUids } from '../flex/uid'
import { loadUserTemplates, saveUserTemplate } from '../flex/userTemplates'

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

  const doSave = () => {
    if (!trimmed) {
      setError('ตั้งชื่อ template ก่อนนะครับ')
      return
    }
    const result = saveUserTemplate({
      name: trimmed,
      json: stripUids(root),
      altText,
      dataText,
    })
    if (result === null) {
      setError('บันทึกไม่สำเร็จ — พื้นที่เก็บของ browser เต็ม (ลองลบ template เก่า หรือเปลี่ยนรูป data URI เป็น URL)')
      return
    }
    setSaved(true)
    setTimeout(() => {
      setModal(null)
      setName('')
      setSaved(false)
      setError(null)
    }, 700)
  }

  return (
    <div className="modal-overlay" onClick={() => setModal(null)}>
      <div className="modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b>บันทึกเป็น template ของฉัน</b>
          <button className="icon-btn" onClick={() => setModal(null)}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label className="field">
            <span className="field-label">ชื่อ template</span>
            <input
              autoFocus
              value={name}
              placeholder="เช่น ใบเสร็จร้านกาแฟ v2"
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && doSave()}
            />
          </label>
          {willOverwrite && !saved && (
            <div className="hint">⚠️ มี template ชื่อนี้อยู่แล้ว — การบันทึกจะเขียนทับของเดิม</div>
          )}
          <div className="hint">
            จะบันทึกทั้งดีไซน์, altText และ data source ไว้ใน browser เครื่องนี้ — เปิดใช้ได้จากปุ่ม Templates
          </div>
          {error && <div className="status error">{error}</div>}
          {saved && <div className="status ok">บันทึกแล้ว ✓</div>}
          <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn primary" onClick={doSave} disabled={saved}>
              <Save size={14} /> บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
