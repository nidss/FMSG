import React, { useMemo, useState } from 'react'
import { Check, Copy, Send } from 'lucide-react'
import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Banner } from '@astryxdesign/core/Banner'
import { Collapsible } from '@astryxdesign/core/Collapsible'
import { useDesigner } from '../store'
import { useUi } from '../uiStore'
import { curlCommand, exportMessageJson } from '../flex/export'
import { AppModal } from './AppModal'

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
    } catch {
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
    <AppModal title="ส่งเข้า LINE (Push Message)" width={720} onClose={() => setModal(null)}>
      <div className="modal-stack">
        <TextInput
          label="Channel Access Token (จาก LINE Developers Console)"
          type="password"
          value={token}
          onChange={setToken}
          placeholder="Bearer token"
        />
        <TextInput
          label="User ID ผู้รับ (ขึ้นต้นด้วย U...)"
          value={to}
          onChange={setTo}
          placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        />
        {bindingEnabled && <div className="hint">โหมด binding เปิดอยู่ — จะส่งข้อความที่แทนค่า {'{{...}}'} แล้ว</div>}
        <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
          <Button
            label={status.kind === 'sending' ? 'กำลังส่ง…' : 'ส่งเลย'}
            icon={<Send size={14} />}
            variant="primary"
            isDisabled={!token || !to}
            isLoading={status.kind === 'sending'}
            onClick={doSend}
          />
        </div>
        {status.kind === 'ok' && <Banner status="success" title={status.msg!} />}
        {status.kind === 'error' && <Banner status="error" title="ส่งไม่สำเร็จ" description={status.msg} />}
        <Collapsible trigger="ทางเลือก: คำสั่ง curl (รัน terminal ได้เลย ไม่ติด CORS)">
          <pre className="code-view" style={{ maxHeight: 180 }}>{curl}</pre>
          <div className="btn-row" style={{ justifyContent: 'flex-end', paddingTop: 8 }}>
            <Button
              label={copied ? 'คัดลอกแล้ว' : 'คัดลอก curl'}
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(curl)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
            />
          </div>
        </Collapsible>
        <div className="hint">
          Token และ User ID ถูกเก็บใน browser ของคุณเท่านั้น (localStorage) — ไม่ถูกส่งไปที่อื่นนอกจาก LINE API
        </div>
      </div>
    </AppModal>
  )
}
