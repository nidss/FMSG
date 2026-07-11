import React, { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { IconButton } from '@astryxdesign/core/IconButton'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { useDesigner } from '../store'
import { useUi } from '../uiStore'
import { collectPlaceholders, lookup } from '../flex/binding'
import { stripUids } from '../flex/uid'

export function DataPanel() {
  const showData = useUi((s) => s.showData)
  const toggleData = useUi((s) => s.toggleData)
  const dataText = useDesigner((s) => s.dataText)
  const setDataText = useDesigner((s) => s.setDataText)
  const bindingEnabled = useDesigner((s) => s.bindingEnabled)
  const setBindingEnabled = useDesigner((s) => s.setBindingEnabled)
  const root = useDesigner((s) => s.root)
  const [draft, setDraft] = useState<string | null>(null)

  const parsed = useMemo(() => {
    try {
      return { data: JSON.parse(draft ?? dataText), error: null }
    } catch (e: any) {
      return { data: null, error: String(e.message ?? e) }
    }
  }, [draft, dataText])

  const placeholders = useMemo(() => collectPlaceholders(stripUids(root)), [root])

  if (!showData) return null

  return (
    <div className="data-panel">
      <div className="panel-title">
        Data Source
        <span style={{ marginLeft: 'auto' }}>
          <IconButton label="ปิด Data panel" icon={<X size={14} />} variant="ghost" size="sm" onClick={toggleData} />
        </span>
      </div>
      <div style={{ padding: '4px 12px' }}>
        <CheckboxInput
          label={'แสดงข้อมูลจริงใน preview (แทนค่า {{...}})'}
          value={bindingEnabled}
          onChange={(c: boolean) => setBindingEnabled(c)}
          size="sm"
        />
      </div>
      <textarea
        className="data-editor"
        value={draft ?? dataText}
        spellCheck={false}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null && parsed.error === null) {
            setDataText(draft)
            setDraft(null)
          }
        }}
      />
      {parsed.error && <div className="status error" style={{ margin: '0 12px' }}>JSON ไม่ถูกต้อง: {parsed.error}</div>}
      <div className="placeholder-list">
        <div className="panel-title" style={{ borderTop: '1px solid var(--border)' }}>
          ตัวแปรที่ใช้ใน template ({placeholders.length})
        </div>
        {placeholders.length === 0 && (
          <div className="hint" style={{ padding: '4px 12px 10px' }}>
            พิมพ์ {'{{ชื่อตัวแปร}}'} ในข้อความ / URL / label ใดก็ได้ เช่น {'{{name}}'} แล้วค่าจะถูกดึงมาจาก JSON
            ด้านบน
          </div>
        )}
        {placeholders.map((p) => {
          const v = parsed.data ? lookup(parsed.data, p) : undefined
          return (
            <div key={p} className={`placeholder-row${v === undefined ? ' missing' : ''}`}>
              <code>{`{{${p}}}`}</code>
              <span>{v === undefined ? '— ไม่มีในข้อมูล' : String(v)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
