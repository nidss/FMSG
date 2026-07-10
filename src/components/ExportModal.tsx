import React, { useMemo, useState } from 'react'
import { Check, Copy, Download, X } from 'lucide-react'
import { useDesigner } from '../store'
import { useUi } from '../uiStore'
import { exportJs, exportJson, exportMessageJson } from '../flex/export'
import { collectPlaceholders } from '../flex/binding'
import { stripUids } from '../flex/uid'

type Tab = 'json' | 'message' | 'js'

export function ExportModal() {
  const modal = useUi((s) => s.modal)
  const setModal = useUi((s) => s.setModal)
  const root = useDesigner((s) => s.root)
  const altText = useDesigner((s) => s.altText)
  const dataText = useDesigner((s) => s.dataText)
  const [tab, setTab] = useState<Tab>('json')
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
    <div className="modal-overlay" onClick={() => setModal(null)}>
      <div className="modal" style={{ width: 760, maxWidth: '95vw' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b>Export</b>
          <button className="icon-btn" onClick={() => setModal(null)}>
            <X size={16} />
          </button>
        </div>
        <div className="tab-row">
          <button className={`tab${tab === 'json' ? ' active' : ''}`} onClick={() => setTab('json')}>
            JSON (contents)
          </button>
          <button className={`tab${tab === 'message' ? ' active' : ''}`} onClick={() => setTab('message')}>
            JSON (message เต็ม)
          </button>
          <button className={`tab${tab === 'js' ? ' active' : ''}`} onClick={() => setTab('js')}>
            JavaScript + bind()
          </button>
        </div>
        {tab !== 'js' && placeholders.length > 0 && (
          <label className="field-row" style={{ padding: '6px 16px' }}>
            <input type="checkbox" checked={applyData} onChange={(e) => setApplyData(e.target.checked)} />
            <span>
              แทนค่า {'{{...}}'} ด้วยข้อมูลจาก Data panel ({placeholders.join(', ')})
              {applyData && !data && <b style={{ color: '#d33' }}> — JSON ใน Data panel ไม่ถูกต้อง</b>}
            </span>
          </label>
        )}
        {tab === 'js' && (
          <div className="hint" style={{ padding: '6px 16px' }}>
            ได้ไฟล์ JS พร้อมฟังก์ชัน <code>buildFlexMessage(data)</code> — ส่งข้อมูลเข้าไปแล้วได้ message
            พร้อมส่งผ่าน Messaging API โดยไม่ต้องเขียนโค้ด bind เอง
          </div>
        )}
        <pre className="code-view">{content}</pre>
        <div className="btn-row" style={{ padding: '0 16px 14px', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={download}>
            <Download size={14} /> ดาวน์โหลด
          </button>
          <button className="btn primary" onClick={copy}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
          </button>
        </div>
      </div>
    </div>
  )
}
