import React, { useMemo, useState } from 'react'
import { icons } from 'lucide-react'
import { TextInput } from '@astryxdesign/core/TextInput'
import { useUi } from '../uiStore'
import { useDesigner } from '../store'
import { AppModal } from './AppModal'

const ALL_NAMES = Object.keys(icons)

function kebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

/** URL ที่ preview แสดงได้ทันที (Iconify CDN เสิร์ฟ Lucide เป็น SVG พร้อมสี) */
export function lucideUrl(name: string, color: string): string {
  return `https://api.iconify.design/lucide/${kebab(name)}.svg?color=${encodeURIComponent(color)}`
}

export function IconPickerModal() {
  const iconPicker = useUi((s) => s.iconPicker)
  const close = useUi((s) => s.closeIconPicker)
  const updateNode = useDesigner((s) => s.updateNode)
  const [query, setQuery] = useState('')
  const [color, setColor] = useState('#111111')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const names = q ? ALL_NAMES.filter((n) => n.toLowerCase().includes(q) || kebab(n).includes(q)) : ALL_NAMES
    return names.slice(0, 240)
  }, [query])

  if (!iconPicker) return null

  return (
    <AppModal title="เลือก Lucide Icon" subtitle={`${ALL_NAMES.length} icons`} width={660} onClose={close}>
      <div className="modal-stack">
        <div className="btn-row">
          <div style={{ flex: 1 }}>
            <TextInput
              label="ค้นหา icon"
              isLabelHidden
              hasAutoFocus
              placeholder="ค้นหา icon เช่น star, phone, cart…"
              value={query}
              onChange={setQuery}
              size="sm"
              hasClear
            />
          </div>
          <label className="color-mini">
            สี <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>
        </div>
        <div className="icon-grid">
          {filtered.map((name) => {
            const Icon = (icons as any)[name]
            return (
              <button
                key={name}
                className="icon-cell"
                title={kebab(name)}
                onClick={() => {
                  updateNode(iconPicker.uid, { [iconPicker.prop]: lucideUrl(name, color) })
                  close()
                }}
              >
                <Icon size={20} color={color} />
                <span>{kebab(name)}</span>
              </button>
            )
          })}
          {filtered.length === 0 && <div className="hint" style={{ padding: 16 }}>ไม่พบ icon ที่ค้นหา</div>}
        </div>
        <div className="hint">
          icon จะถูกใส่เป็น URL จาก Iconify CDN (SVG) — แสดงผลใน preview ได้ทันที ส่วนการส่งเข้า LINE จริง
          แนะนำให้ใช้รูป PNG บน hosting ของคุณเพื่อความเข้ากันได้สูงสุด
        </div>
      </div>
    </AppModal>
  )
}
