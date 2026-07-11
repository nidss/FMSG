import React, { useMemo, useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'
import { Button } from '@astryxdesign/core/Button'
import { TabList, Tab } from '@astryxdesign/core/TabList'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { useDesigner } from '../store'
import { useUi } from '../uiStore'
import { exportJs, exportJson, exportMessageJson } from '../flex/export'
import { collectPlaceholders } from '../flex/binding'
import { stripUids } from '../flex/uid'
import { AppModal } from './AppModal'

type TabKey = 'json' | 'message' | 'js'

export function ExportModal() {
  const modal = useUi((s) => s.modal)
  const setModal = useUi((s) => s.setModal)
  const root = useDesigner((s) => s.root)
  const altText = useDesigner((s) => s.altText)
  const dataText = useDesigner((s) => s.dataText)
  const [tab, setTab] = useState<TabKey>('json')
  const [applyData, setApplyData] = useState(false)
  const [copied, setCopied] = useState(false)

  const placeholders = useMemo(() => collectPlaceholders(stripUids(root)), [root])

  const data = useMemo(() => {
    try {
      return JSON.parse(dataText)
    } catch {
      return null
    }
  }, [dataText])

  const content = useMemo(() => {
    const d = applyData && data ? data : undefined
    if (tab === 'json') return exportJson(root, d)
    if (tab === 'message') return exportMessageJson(root, altText, d)
    return exportJs(root, altText)
  }, [tab, root, altText, applyData, data])

  if (modal !== 'export') return null

  const copy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    const name = tab === 'js' ? 'flex-message.js' : 'flex-message.json'
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <AppModal title="Export" width={780} onClose={() => setModal(null)}>
      <div className="modal-stack">
        <TabList value={tab} onChange={(v: any) => setTab(v)} size="sm">
          <Tab value="json" label="JSON (contents)" />
          <Tab value="message" label="JSON (message เต็ม)" />
          <Tab value="js" label="JavaScript + bind()" />
        </TabList>
        {tab !== 'js' && placeholders.length > 0 && (
          <CheckboxInput
            label={`แทนค่า {{...}} ด้วยข้อมูลจาก Data panel (${placeholders.join(', ')})${applyData && !data ? ' — JSON ใน Data panel ไม่ถูกต้อง!' : ''}`}
            value={applyData}
            onChange={(c: boolean) => setApplyData(c)}
            size="sm"
          />
        )}
        {tab === 'js' && (
          <div className="hint">
            ได้ไฟล์ JS พร้อมฟังก์ชัน <code>buildFlexMessage(data)</code> — ส่งข้อมูลเข้าไปแล้วได้ message
            พร้อมส่งผ่าน Messaging API โดยไม่ต้องเขียนโค้ด bind เอง
          </div>
        )}
        <pre className="code-view">{content}</pre>
        <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
          <Button label="ดาวน์โหลด" icon={<Download size={14} />} size="sm" onClick={download} />
          <Button
            label={copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
            icon={copied ? <Check size={14} /> : <Copy size={14} />}
            variant="primary"
            size="sm"
            onClick={copy}
          />
        </div>
      </div>
    </AppModal>
  )
}
