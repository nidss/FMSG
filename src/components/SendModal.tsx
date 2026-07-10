import React, { useMemo, useState } from 'react'
import { Check, Copy, Send, X } from 'lucide-react'
import { useDesigner } from '../store'
import { useUi } from '../uiStore'
import { curlCommand, exportMessageJson } from '../flex/export'

export function SendModal() {
  const modal = useUi((s) => s.modal)
  const setModal = useUi((s) => s.setModal)
  const root = useDesigner((s) => s.root)
  const altText = useDesigner((s) => s.altText)
  const dataText = useDesigner((s) => s.dataText)
  const bindingEnabled = useDesigner((s) => s.bindingEnabled)

  const [token, setToken] = useState(() => localStorage.getItem('fmsg-token') ?? '')
  const [to, setTo] = useState(() => localStorage.getItem('fmsg-to') ?? '')
  const [status, setStatus] = useState<{ kind: 'idle' | 'sending' | 'ok' | 'error'; msg?: string }>({ kind: 'idle' })
  const [copied, setCopied] = useState(false)

  const data = useMemo(() => {
    if (!bindingEnabled) return undefined
    try {
      return JSON.parse(dataText)
    } catch {
      return undefined
    }
  }, [dataText, bindingEnabled])

  if (modal !== 'send') return null

  const doSend = async () => {
    localStorage.setItem('fmsg-token', token)
    localStorage.setItem('fmsg-to', to)
    setStatus({ kind: 'sending' })
    try {
      const contents = JSON.parse(exportMessageJson(root, altText, data))
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to, messages: [contents] }),
      })
      if (res.ok) setStatus({ kind: 'ok', msg: 'ส่งสำเร็จ! เปิด LINE ดูข้อความได้เลย 🎉' })
      else {
        const body = await res.text()
        setStatus({ kind: 'error', msg: `LINE API ตอบ ${res.status}: ${body.slice(0, 300)}` })
      }
    } catch (e: any) {
      setStatus({
        kind: 'error',
        msg:
          'เรียก API จาก browser โดยตรงไม่สำเร็จ (ปกติคือติด CORS ของ api.line.me) — ' +
          'ใช้คำสั่ง curl ด้านล่างแทนได้เลย หรือยิงผ่าน backend/proxy ของคุณ',
      })
    }
  }

  const curl = curlCommand(root, altText, token, to || '<USER_ID>', data)

  return (
    <div className="modal-overlay" onClick={() => setModal(null)}>
      <div className="modal" style={{ width: 700, maxWidth: '95vw' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b>ส่งเข้า LINE (Push Message)</b>
          <button className="icon-btn" onClick={() => setModal(null)}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '0 16px' }}>
          <label className="field">
            <span className="field-label">Channel Access Token (จาก LINE Developers Console)</span>
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Bearer token" />
          </label>
          <label className="field">
            <span className="field-label">User ID ผู้รับ (ขึ้นต้นด้วย U...)</span>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </label>
          {bindingEnabled && <div className="hint">โหมด binding เปิดอยู่ — จะส่งข้อความที่แทนค่า {'{{...}}'} แล้ว</div>}
          <div className="btn-row" style={{ justifyContent: 'flex-end', padding: '8px 0' }}>
            <button className="btn primary" disabled={!token || !to || status.kind === 'sending'} onClick={doSend}>
              <Send size={14} /> {status.kind === 'sending' ? 'กำลังส่ง…' : 'ส่งเลย'}
            </button>
          </div>
          {status.kind === 'ok' && <div className="status ok">{status.msg}</div>}
          {status.kind === 'error' && <div className="status error">{status.msg}</div>}
          <details style={{ margin: '10px 0 4px' }} open={status.kind === 'error'}>
            <summary>ทางเลือก: คำสั่ง curl (รัน terminal ได้เลย ไม่ติด CORS)</summary>
            <pre className="code-view" style={{ maxHeight: 180 }}>{curl}</pre>
            <div className="btn-row" style={{ justifyContent: 'flex-end', paddingBottom: 8 }}>
              <button
                className="btn"
                onClick={async () => {
                  await navigator.clipboard.writeText(curl)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} คัดลอก curl
              </button>
            </div>
          </details>
          <div className="hint" style={{ paddingBottom: 14 }}>
            Token และ User ID ถูกเก็บใน browser ของคุณเท่านั้น (localStorage) — ไม่ถูกส่งไปที่อื่นนอกจาก LINE API
          </div>
        </div>
      </div>
    </div>
  )
}
